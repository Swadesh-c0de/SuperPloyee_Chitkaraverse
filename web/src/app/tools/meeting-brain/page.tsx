"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNeuralStore, type MeetingReport } from "@/lib/store";
import { SOURCE_SEEDS } from "@/lib/neural-seed";
import {
  PhoneOff, Brain, Sparkles,
  CheckCircle2, AlertCircle, FileText, Shield,
  ArrowRight, TrendingUp, Network,
  Loader2, Activity, Copy, RotateCcw,
  Mic, MicOff, Bot, User, Search, Database,
  Wifi, Settings, X, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type MeetingPhase = "idle" | "joining" | "live" | "ending" | "analysis";
type TranscriptRole = "user" | "bot";

interface TranscriptLine {
  id: string;
  role: TranscriptRole;
  text: string;
  interim?: boolean;
  timestamp: number;
}

interface ToolEvent {
  id: string;
  type: "tool_call" | "tool_result";
  tool: string;
  args?: Record<string, string>;
  result?: string;
  timestamp: number;
}

interface AnalysisResult {
  summary?: string;
  sentiment?: string;
  decisions?: { text: string; owner: string; confidence: number }[];
  actions?: { text: string; owner: string; deadline: string; priority: string }[];
  unresolved?: string[];
  kbMatches?: { label: string; relevance: string }[];
  riskFlags?: string[];
  followUpDraft?: string;
}

// ── Languages ─────────────────────────────────────────────────────────────────
const LANGUAGES = [
  { value: "en-IN", label: "English (India)" },
  { value: "hi-IN", label: "हिन्दी" },
];

// ── KB context builder ────────────────────────────────────────────────────────
function buildKbContext(liveNodes: { id: string; label: string; type: string; source: string; content?: string }[], connectedApps: string[]) {
  const lines: string[] = [`Connected: ${connectedApps.join(", ") || "none"}`];
  liveNodes.forEach(n => {
    lines.push(`- [${n.source}/${n.type}] ${n.label}${n.content ? `: ${n.content.slice(0, 120)}` : ""}`);
  });
  connectedApps.forEach(app => {
    SOURCE_SEEDS[app]?.nodes.forEach(n => {
      lines.push(`- [${app}/${n.type}] ${n.label}${n.content ? `: ${n.content.slice(0, 100)}` : ""}`);
    });
  });
  // Cap at 60 lines to stay within a reasonable token budget per request
  return lines.slice(0, 61).join("\n");
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <span className="inline-flex gap-[3px] items-end h-4">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full bg-white/60 inline-block"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </span>
  );
}

function ToolCallCard({ event }: { event: ToolEvent }) {
  const isCall = event.type === "tool_call";
  const Icon = event.tool === "search_knowledge_base" ? Search : event.tool === "get_meeting_context" ? Brain : Database;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-start gap-2 px-3 py-2 rounded-lg border text-[10px] font-mono",
        isCall ? "bg-white/[0.03] border-white/8 text-white/40" : "bg-white/[0.05] border-white/10 text-white/50"
      )}
    >
      <Icon className="h-3 w-3 shrink-0 mt-0.5 text-white/30" />
      <div className="min-w-0">
        <span className={cn("font-black uppercase tracking-widest", isCall ? "text-white/30" : "text-white/40")}>
          {isCall ? `→ ${event.tool.replace(/_/g, " ")}` : "← result"}
        </span>
        {isCall && event.args && (
          <p className="text-white/25 truncate mt-0.5">
            {Object.entries(event.args).map(([k, v]) => `${k}: "${v}"`).join(", ")}
          </p>
        )}
        {!isCall && event.result && (
          <p className="text-white/30 line-clamp-2 mt-0.5 leading-relaxed">{event.result}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function MeetingBrainPage() {
  const { liveNodes, connectedApps, addMeetingReport, addSyncLog } = useNeuralStore();

  const [phase, setPhase] = useState<MeetingPhase>("idle");
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [language, setLanguage] = useState("en-IN");

  const [meetUrl, setMeetUrl] = useState("");
  const [botName, setBotName] = useState("Cortex AI");
  const [botStatus, setBotStatus] = useState<"idle" | "joining" | "joined" | "error">("idle");
  const [botLogs, setBotLogs] = useState<string[]>([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [cookiePaste, setCookiePaste] = useState("");
  const [cookieSaving, setCookieSaving] = useState(false);
  const [cookieMsg, setCookieMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [lines, setLines] = useState<TranscriptLine[]>([]);
  const [interimText, setInterimText] = useState("");
  const [isMicOn, setIsMicOn] = useState(false);

  const [isBotThinking, setIsBotThinking] = useState(false);
  const [toolEvents, setToolEvents] = useState<ToolEvent[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recognizerRef = useRef<any>(null);
  const pendingUserText = useRef("");
  const chatHistoryRef = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const callCortexRef = useRef<((text: string) => void) | null>(null);

  // ── Auto-scroll ──
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [lines, interimText, isBotThinking]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  // ── Commit interim to final transcript line ──
  const commitUserUtterance = useCallback((text: string) => {
    if (!text.trim()) return;
    const id = crypto.randomUUID();
    const newLine: TranscriptLine = { id, role: "user", text: text.trim(), timestamp: Date.now() };
    setLines(prev => [...prev, newLine]);
    chatHistoryRef.current = [...chatHistoryRef.current, { role: "user", content: text.trim() }];
    setInterimText("");
    pendingUserText.current = "";
    // Use ref so we always call the latest version of callCortex
    callCortexRef.current?.(text.trim());
  }, []);

  // ── Start Web Speech recognition ──
  const startMic = useCallback(() => {
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = language;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = "";
      let finalChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalChunk += e.results[i][0].transcript;
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      if (interim) setInterimText(interim);
      if (finalChunk) {
        pendingUserText.current += finalChunk;
        setInterimText("");
        commitUserUtterance(pendingUserText.current);
      }
    };

    rec.onerror = () => { setIsMicOn(false); };
    rec.onend = () => {
      if (isMicOn) {
        try { rec.start(); } catch {}
      }
    };

    recognizerRef.current = rec;
    try { rec.start(); setIsMicOn(true); } catch {}
  }, [language, isMicOn, commitUserUtterance]);

  const stopMic = useCallback(() => {
    recognizerRef.current?.stop();
    setIsMicOn(false);
    setInterimText("");
  }, []);

  const toggleMic = () => {
    if (isMicOn) stopMic();
    else startMic();
  };

  // ── Call Gemini via /api/meeting-chat (streaming SSE) ──
  const callCortex = useCallback(async (userText: string) => {
    setIsBotThinking(true);
    const kbContext = buildKbContext(liveNodes, connectedApps);

    // Build transcript from history EXCLUDING the just-added user turn (last entry)
    // so the transcript in the system prompt doesn't double-count it
    const historyForTranscript = chatHistoryRef.current.slice(0, -1);
    const transcript = historyForTranscript
      .map(m => `${m.role === "user" ? "User" : "Cortex"}: ${m.content}`)
      .join("\n");

    // messages = full history (including new user turn) — the API pops the last one as sendMessage input
    const messages = chatHistoryRef.current.map(m => ({ role: m.role, content: m.content }));

    let botId = crypto.randomUUID();
    let accumulated = "";
    let botLineAdded = false;

    try {
      const res = await fetch("/api/meeting-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, kbContext, transcript }),
      });
      if (!res.ok || !res.body) throw new Error("API error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const raw of chunk.split("\n")) {
          if (!raw.startsWith("data: ")) continue;
          const payload = raw.slice(6).trim();
          try {
            const ev = JSON.parse(payload);
            if (ev.type === "tool_call") {
              const te: ToolEvent = {
                id: ev.id ?? crypto.randomUUID(),
                type: "tool_call",
                tool: ev.tool,
                args: ev.args,
                timestamp: Date.now(),
              };
              setToolEvents(prev => [...prev, te]);
            } else if (ev.type === "tool_result") {
              const te: ToolEvent = {
                id: ev.id ?? crypto.randomUUID(),
                type: "tool_result",
                tool: ev.tool,
                result: ev.result,
                timestamp: Date.now(),
              };
              setToolEvents(prev => [...prev, te]);
            } else if (ev.type === "text") {
              if (!botLineAdded) {
                botLineAdded = true;
                setIsBotThinking(false);
                setLines(prev => [...prev, { id: botId, role: "bot", text: "", timestamp: Date.now() }]);
              }
              accumulated += ev.text;
              setLines(prev => prev.map(l => l.id === botId ? { ...l, text: accumulated } : l));
            } else if (ev.type === "done") {
              chatHistoryRef.current = [...chatHistoryRef.current, { role: "assistant", content: accumulated }];
            } else if (ev.type === "error") {
              throw new Error(ev.message);
            }
          } catch { /* partial line */ }
        }
      }
    } catch (err: unknown) {
      setIsBotThinking(false);
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setLines(prev => [...prev, { id: crypto.randomUUID(), role: "bot", text: `Sorry, I hit an error: ${msg}`, timestamp: Date.now() }]);
    } finally {
      setIsBotThinking(false);
    }
  }, [liveNodes, connectedApps]);

  // ── Keep ref in sync so the stable commitUserUtterance closure always calls the latest callCortex ──
  useEffect(() => {
    callCortexRef.current = callCortex;
  }, [callCortex]);

  // ── Save cookies via settings panel ──
  const saveCookies = useCallback(async () => {
    if (!cookiePaste.trim()) return;
    setCookieSaving(true);
    setCookieMsg(null);
    try {
      const res = await fetch("/api/update-cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookieText: cookiePaste.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCookieMsg({ ok: true, text: `✅ ${data.count} cookies injected into bot` });
        setCookiePaste("");
      } else {
        setCookieMsg({ ok: false, text: `❌ ${data.error}` });
      }
    } catch (err: any) {
      setCookieMsg({ ok: false, text: `❌ ${err.message}` });
    } finally {
      setCookieSaving(false);
    }
  }, [cookiePaste]);

  // ── Join: start mic + timer ──
  const joinMeeting = useCallback(() => {
    setPhase("joining");
    setLines([]);
    setInterimText("");
    setToolEvents([]);
    setElapsedSecs(0);
    setAnalysis(null);
    chatHistoryRef.current = [];

    setTimeout(() => {
      setPhase("live");
      timerIntervalRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);
      startMic();
      const greetId = crypto.randomUUID();
      const greeting = "Cortex is live. I'm monitoring the conversation and have access to your knowledge base. Ask me anything or just talk — I'll jump in when relevant.";
      setLines([{ id: greetId, role: "bot", text: greeting, timestamp: Date.now() }]);
      chatHistoryRef.current = [{ role: "assistant", content: greeting }];
    }, 2200);
  }, [startMic]);

  // ── Single join: spawn bot silently then start mic session ──
  const joinMeetingFull = useCallback(async () => {
    if (!meetUrl.trim()) return;

    // Kick off bot in background (fire and forget the SSE stream)
    setBotStatus("joining");
    setBotLogs([]);
    fetch("/api/join-meet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetUrl: meetUrl.trim(), botName }),
    }).then(async res => {
      if (!res.ok || !res.body) return;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const raw of chunk.split("\n")) {
          if (!raw.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(raw.slice(6));
            if (ev.type === "log" || ev.type === "status") {
              setBotLogs(prev => [...prev.slice(-19), ev.message]);
            } else if (ev.type === "joined") {
              setBotStatus("joined");
            }
          } catch {}
        }
      }
    }).catch(() => setBotStatus("error"));

    // Immediately start local mic session
    joinMeeting();
  }, [meetUrl, botName, joinMeeting]);

  // ── End & Analyze ──
  const endMeeting = async () => {
    stopMic();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPhase("ending");
    await new Promise(r => setTimeout(r, 800));
    setPhase("analysis");
    setIsAnalyzing(true);

    const fullTranscript = lines
      .filter(l => !l.interim)
      .map(l => `${l.role === "user" ? "User" : "Cortex"}: ${l.text}`)
      .join("\n");

    const context = buildKbContext(liveNodes, connectedApps);

    try {
      const res = await fetch("/api/meeting-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: fullTranscript, context }),
      });
      const data = await res.json();
      setAnalysis(data);

      const reportId = `meeting-report-${Date.now()}`;
      const now = Date.now();
      const report: MeetingReport = {
        id: reportId,
        title: `Meeting — ${new Date(now).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        timestamp: now,
        summary: data.summary ?? "",
        sentiment: data.sentiment ?? "neutral",
        decisions: data.decisions ?? [],
        actions: data.actions ?? [],
        unresolved: data.unresolved ?? [],
        kbMatches: data.kbMatches ?? [],
        riskFlags: data.riskFlags ?? [],
        followUpDraft: data.followUpDraft ?? "",
        transcriptLines: lines.length,
      };
      addMeetingReport(report);

      useNeuralStore.setState((s) => ({
        liveNodes: s.liveNodes.find((n) => n.id === reportId)
          ? s.liveNodes
          : [...s.liveNodes, {
              id: reportId,
              label: report.title,
              type: "analysis" as const,
              source: "MEETING_BRAIN",
              content: `${data.summary ?? ""} Decisions: ${(data.decisions ?? []).length}. Actions: ${(data.actions ?? []).length}.`,
            }],
      }));

      addSyncLog({
        id: reportId,
        source: "MEETING_BRAIN",
        title: report.title,
        description: `${report.decisions.length} decisions · ${report.actions.length} action items · ${lines.length} transcript lines`,
        impact: [
          `${report.decisions.length} decisions extracted`,
          `${report.actions.length} action items logged`,
          `Sentiment: ${data.sentiment ?? "neutral"}`,
        ],
        status: "completed",
        timestamp: new Date(now).toISOString(),
      });
    } catch {
      setAnalysis({ summary: "Analysis failed. Please try again.", decisions: [], actions: [], unresolved: [] });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    stopMic();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setPhase("idle");
    setLines([]);
    setInterimText("");
    setToolEvents([]);
    setElapsedSecs(0);
    setAnalysis(null);
    setIsAnalyzing(false);
    chatHistoryRef.current = [];
  };

  const sentimentColor = analysis?.sentiment === "positive" ? "text-white" : analysis?.sentiment === "negative" ? "text-white/50" : "text-white/70";

  return (
    <div className="flex h-screen flex-col bg-background antialiased">
      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSettingsOpen(false)}>
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 space-y-4 mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Cookie Settings</p>
                <p className="text-[10px] text-white/30 mt-0.5">Paste Netscape-format cookies — auto-saved to google.txt and injected into bot</p>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              value={cookiePaste}
              onChange={e => setCookiePaste(e.target.value)}
              placeholder={`# Netscape HTTP Cookie File\n.google.com\tTRUE\t/\t...`}
              rows={9}
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 text-[11px] font-mono text-white/60 placeholder:text-white/15 outline-none focus:border-white/25 transition-colors resize-none"
            />
            {cookieMsg && (
              <p className={`text-[11px] font-mono ${cookieMsg.ok ? "text-white/50" : "text-red-400/70"}`}>{cookieMsg.text}</p>
            )}
            <button
              onClick={saveCookies}
              disabled={!cookiePaste.trim() || cookieSaving}
              className="w-full h-10 rounded-xl bg-white text-background font-black text-[11px] uppercase tracking-wider hover:opacity-90 disabled:opacity-30 transition-opacity flex items-center justify-center gap-2"
            >
              {cookieSaving ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Injecting...</> : <>Update Cookies</>}
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-white/5 px-8 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight text-white uppercase">Meeting Brain</span>
          <div className="hidden md:flex h-8 w-[1px] bg-white/10 mx-2" />
          <Badge variant="outline" className="instrument-border text-white/40 label-sm">
            {phase === "idle" ? "STANDBY" : phase === "joining" ? "CONNECTING..." : phase === "live" ? "LIVE" : phase === "ending" ? "ENDING..." : "POST_ANALYSIS"}
          </Badge>
        </div>
        {phase === "idle" && (
          <button
            onClick={() => { setSettingsOpen(true); setCookieMsg(null); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/8 text-white/25 hover:text-white/50 hover:border-white/15 transition-all"
          >
            <Settings className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Cookies</span>
          </button>
        )}
        {phase === "live" && (
          <div className="flex items-center gap-4">
            {botStatus === "joined" && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/8 border border-white/10">
                <Wifi className="h-3 w-3 text-white/50" />
                <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Bot in Meet</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{formatTime(elapsedSecs)}</span>
            </div>
            <button
              onClick={endMeeting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-[11px] font-black uppercase tracking-widest text-white/60 hover:text-white"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              END & ANALYZE
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── IDLE ── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex h-full items-center justify-center p-8"
            >
              <div className="w-full max-w-md space-y-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-white/60" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Meeting Brain</h2>
                  <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
                    Start a live session. Cortex will listen via your mic, respond in real time, and query your knowledge base on demand.
                  </p>
                </div>

                <div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-4">
                  {/* Meet URL */}
                  <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 rounded-lg px-3 focus-within:border-white/25 transition-colors">
                    <Mic className="h-3.5 w-3.5 text-white/20 shrink-0" />
                    <input
                      type="url"
                      value={meetUrl}
                      onChange={e => setMeetUrl(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className="flex-1 h-10 bg-transparent text-[12px] text-white/70 placeholder:text-white/20 outline-none"
                    />
                  </div>

                  {/* Language */}
                  <div className="flex gap-2">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.value}
                        onClick={() => setLanguage(l.value)}
                        className={cn(
                          "flex-1 h-8 rounded-lg text-[11px] font-bold border transition-all",
                          language === l.value
                            ? "bg-white text-background border-white"
                            : "bg-white/[0.03] border-white/10 text-white/40 hover:border-white/20"
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>

                  {/* Single join button */}
                  <button
                    onClick={meetUrl.trim() ? joinMeetingFull : joinMeeting}
                    className="w-full h-12 rounded-xl bg-white text-background font-black text-sm tracking-wider uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    <Mic className="h-4 w-4" />
                    Join Meeting
                  </button>

                  {meetUrl.trim() && (
                    <p className="text-[9px] text-white/20 font-mono text-center">
                      Bot will silently join <span className="text-white/35">{meetUrl.trim().replace("https://", "")}</span> · mic session starts immediately
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className={cn("h-1.5 w-1.5 rounded-full", liveNodes.length > 0 ? "bg-white" : "bg-white/20")} />
                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                      {liveNodes.length} Knowledge Nodes
                    </span>
                  </div>
                  <div className="h-3 w-[1px] bg-white/10" />
                  <div className="flex items-center gap-1.5">
                    <Network className="h-3 w-3 text-white/20" />
                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                      {connectedApps.length} Sources Connected
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── JOINING ── */}
          {phase === "joining" && (
            <motion.div
              key="joining"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <div className="text-center space-y-8">
                <div className="relative mx-auto w-24 h-24">
                  <div className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Brain className="h-10 w-10 text-white/60" />
                  </div>
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-3 rounded-full border border-dashed border-white/15" />
                  <motion.div animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-6 rounded-full border border-dashed border-white/8" />
                </div>
                <div className="space-y-2">
                  <p className="text-white font-bold text-lg tracking-tight">Cortex is Initializing...</p>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">LOADING KNOWLEDGE GRAPH · ACTIVATING MIC</p>
                </div>
                {["Loading knowledge graph context...", "Activating real-time NLP engine...", "Connecting microphone..."].map((step, i) => (
                  <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}
                    className="flex items-center gap-3 justify-center">
                    <Loader2 className="h-3 w-3 text-white/30 animate-spin" />
                    <span className="text-[10px] text-white/40 font-mono">{step}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── LIVE ── */}
          {phase === "live" && (
            <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex h-full gap-0">

              {/* Left: Two-sided transcript */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Session</span>
                  <div className="ml-auto flex items-center gap-3">
                    <span className="text-[10px] font-mono text-white/20">{lines.length} turns</span>
                    {/* Mic toggle */}
                    <button
                      onClick={toggleMic}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all",
                        isMicOn
                          ? "bg-white/10 border-white/20 text-white"
                          : "bg-white/[0.03] border-white/8 text-white/30 hover:border-white/15"
                      )}
                    >
                      {isMicOn ? <Mic className="h-3 w-3" /> : <MicOff className="h-3 w-3" />}
                      {isMicOn ? "Mic On" : "Mic Off"}
                    </button>
                  </div>
                </div>

                {/* Separator label */}
                <div className="flex items-center gap-4 px-6 py-2 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <User className="h-3 w-3 text-white/20" />
                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">You</span>
                  </div>
                  <div className="flex-1 h-[1px] bg-white/5" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">Cortex</span>
                    <Bot className="h-3 w-3 text-white/20" />
                  </div>
                </div>

                <div ref={transcriptRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4">
                  <AnimatePresence initial={false}>
                    {lines.map((line) => (
                      <motion.div
                        key={line.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className={cn("flex gap-3", line.role === "user" ? "justify-end" : "justify-start")}
                      >
                        {line.role === "bot" && (
                          <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <Bot className="h-3.5 w-3.5 text-white/50" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          line.role === "user"
                            ? "bg-white text-background font-medium rounded-br-sm"
                            : "bg-white/5 border border-white/8 text-white/80 rounded-bl-sm"
                        )}>
                          {line.text || <TypingDots />}
                        </div>
                        {line.role === "user" && (
                          <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-white/50" />
                          </div>
                        )}
                      </motion.div>
                    ))}

                    {/* Interim user text */}
                    {interimText && (
                      <motion.div
                        key="interim"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex gap-3 justify-end"
                      >
                        <div className="max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-white/5 border border-dashed border-white/15 text-white/40 rounded-br-sm italic">
                          {interimText}
                        </div>
                        <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-white/50" />
                        </div>
                      </motion.div>
                    )}

                    {/* Bot thinking */}
                    {isBotThinking && (
                      <motion.div key="thinking" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
                        <div className="shrink-0 mt-1 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                            <Sparkles className="h-3.5 w-3.5 text-white/50" />
                          </motion.div>
                        </div>
                        <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-white/5 border border-white/8">
                          <TypingDots />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {lines.length === 0 && !interimText && !isBotThinking && (
                    <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
                      <Mic className="h-8 w-8 text-white/30" />
                      <p className="text-[11px] text-white/40 font-mono text-center">
                        {isMicOn ? "Listening... start speaking" : "Mic is off — click Mic On to start"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Cortex Intelligence Panel */}
              <div className="w-80 shrink-0 flex flex-col bg-background">
                <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Cortex Activity</span>
                </div>

                {/* Tool calls feed */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                  {toolEvents.length === 0 && !isBotThinking && (
                    <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-30">
                      <Activity className="h-5 w-5 text-white/20 animate-pulse" />
                      <p className="text-[9px] text-white/20 uppercase tracking-widest font-black text-center leading-relaxed max-w-[140px]">
                        Tool calls will appear here when Cortex queries the KB
                      </p>
                    </div>
                  )}
                  {isBotThinking && toolEvents.length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2">
                      <Loader2 className="h-3 w-3 text-white/30 animate-spin" />
                      <span className="text-[10px] text-white/30 font-mono">Cortex is reasoning...</span>
                    </div>
                  )}
                  <AnimatePresence initial={false}>
                    {[...toolEvents].reverse().map(ev => (
                      <ToolCallCard key={ev.id} event={ev} />
                    ))}
                  </AnimatePresence>
                </div>

                {/* KB status */}
                <div className="p-4 border-t border-white/5 space-y-2">
                  <p className="text-[9px] font-black text-white/15 uppercase tracking-widest">Active Memory</p>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-white/20" />
                    <span className="text-[10px] text-white/30">{liveNodes.length} nodes · {connectedApps.length} sources</span>
                  </div>
                  {connectedApps.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {connectedApps.slice(0, 4).map(app => (
                        <span key={app} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/20 font-mono">{app}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ENDING ── */}
          {phase === "ending" && (
            <motion.div key="ending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 text-white/30 animate-spin mx-auto" />
                <p className="text-white font-bold">Ending session...</p>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Finalizing transcript · Preparing analysis</p>
              </div>
            </motion.div>
          )}

          {/* ── ANALYSIS ── */}
          {phase === "analysis" && (
            <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full overflow-y-auto no-scrollbar">
              {isAnalyzing ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-center space-y-6">
                    <div className="relative mx-auto w-20 h-20">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Brain className="h-8 w-8 text-white/40" />
                      </div>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute -inset-3 rounded-full border border-dashed border-white/15" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-white font-bold">Analyzing Full Transcript...</p>
                      {["Cross-referencing knowledge base...", "Extracting decisions and actions...", "Generating executive summary..."].map((s, i) => (
                        <motion.p key={s} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.8 }}
                          className="text-[10px] text-white/30 font-mono">{s}</motion.p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : analysis && (
                <div className="max-w-5xl mx-auto p-8 space-y-8 pb-20">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Post-Meeting Intelligence</h2>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                        {lines.length} transcript turns · Groq Llama 3.3 70B
                      </p>
                    </div>
                    <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/8 text-white/30 hover:text-white/60 transition-all text-[10px] font-black uppercase tracking-widest">
                      <RotateCcw className="h-3 w-3" />
                      New Meeting
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 glass-panel border border-white/8 rounded-2xl p-6 space-y-3">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Executive Summary</p>
                      <p className="text-sm text-white/70 leading-relaxed">{analysis.summary}</p>
                    </div>
                    <div className="glass-panel border border-white/8 rounded-2xl p-6 flex flex-col items-center justify-center gap-3">
                      <TrendingUp className="h-6 w-6 text-white/30" />
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Sentiment</p>
                      <p className={cn("text-xl font-black uppercase", sentimentColor)}>{analysis.sentiment || "—"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "Decisions", val: analysis.decisions?.length ?? 0, icon: CheckCircle2 },
                      { label: "Action Items", val: analysis.actions?.length ?? 0, icon: FileText },
                      { label: "Unresolved", val: analysis.unresolved?.length ?? 0, icon: AlertCircle },
                      { label: "KB Matches", val: analysis.kbMatches?.length ?? 0, icon: Network },
                    ].map(s => (
                      <div key={s.label} className="glass-panel border border-white/8 rounded-2xl p-5 flex flex-col items-center gap-2">
                        <s.icon className="h-4 w-4 text-white/20" />
                        <span className="text-3xl font-black text-white">{s.val}</span>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{s.label}</span>
                      </div>
                    ))}
                  </div>

                  {(analysis.decisions?.length ?? 0) > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Decisions Made</p>
                      {analysis.decisions!.map((d, i) => (
                        <div key={i} className="flex items-start gap-4 glass-panel border border-white/8 rounded-xl p-4">
                          <CheckCircle2 className="h-4 w-4 text-white/50 shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm text-white/80">{d.text}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-[10px] text-white/30 font-mono">{d.owner}</span>
                              <div className="flex items-center gap-1.5">
                                <div className="w-16 h-0.5 bg-white/8 rounded-full overflow-hidden">
                                  <div className="h-full bg-white/40 rounded-full" style={{ width: `${d.confidence}%` }} />
                                </div>
                                <span className="text-[9px] text-white/20 font-mono">{d.confidence}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(analysis.actions?.length ?? 0) > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Action Items</p>
                      {analysis.actions!.map((a, i) => (
                        <div key={i} className="flex items-center gap-4 glass-panel border border-white/8 rounded-xl p-4">
                          <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", a.priority === "high" ? "bg-white" : a.priority === "medium" ? "bg-white/50" : "bg-white/20")} />
                          <div className="flex-1">
                            <p className="text-sm text-white/80">{a.text}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-white/30">{a.owner}</span>
                              <span className="text-[9px] text-white/20 font-mono">{a.deadline}</span>
                              <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                                a.priority === "high" ? "bg-white/10 text-white/60" : "bg-white/5 text-white/30"
                              )}>{a.priority}</span>
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-white/15 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {(analysis.unresolved?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Open Questions</p>
                        {analysis.unresolved!.map((q, i) => (
                          <div key={i} className="flex items-start gap-3 glass-panel border border-white/8 rounded-xl p-4">
                            <AlertCircle className="h-3.5 w-3.5 text-white/30 shrink-0 mt-0.5" />
                            <p className="text-[12px] text-white/50">{q}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {(analysis.kbMatches?.length ?? 0) > 0 && (
                      <div className="space-y-3">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Knowledge Base Matches</p>
                        {analysis.kbMatches!.map((kb, i) => (
                          <div key={i} className="flex items-start gap-3 glass-panel border border-white/8 rounded-xl p-4">
                            <Network className="h-3.5 w-3.5 text-white/30 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[11px] font-bold text-white/60">{kb.label}</p>
                              <p className="text-[10px] text-white/30 mt-0.5">{kb.relevance}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {analysis.followUpDraft && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">AI-Generated Follow-up Email</p>
                        <button
                          onClick={() => { navigator.clipboard.writeText(analysis.followUpDraft!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          className="flex items-center gap-1.5 text-[9px] font-black text-white/20 hover:text-white/50 transition-colors uppercase tracking-widest"
                        >
                          {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copied ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="glass-panel border border-white/8 rounded-2xl p-6">
                        <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{analysis.followUpDraft}</p>
                      </div>
                    </div>
                  )}

                  {(analysis.riskFlags?.length ?? 0) > 0 && (
                    <div className="space-y-3">
                      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Risk Flags</p>
                      {analysis.riskFlags!.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 border border-white/10 bg-white/[0.02] rounded-xl p-4">
                          <Shield className="h-3.5 w-3.5 text-white/40 shrink-0 mt-0.5" />
                          <p className="text-[12px] text-white/50">{r}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
