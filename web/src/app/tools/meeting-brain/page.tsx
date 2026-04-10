"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useNeuralStore } from "@/lib/store";
import { SOURCE_SEEDS } from "@/lib/neural-seed";
import {
  PhoneOff, Video, Brain, Sparkles,
  CheckCircle2, AlertCircle, FileText, Zap, Shield,
  ArrowRight, TrendingUp, Network,
  Loader2, Link2, Activity, Copy, RotateCcw,
} from "lucide-react";

// ── Demo transcript (mock live feed) ──────────────────────────────────────────
const DEMO_LINES: { speaker: string; role: string; text: string; delay: number }[] = [
  { speaker: "Harsh",   role: "Co-founder", text: "Hey Swadesh — let's walk through Superloyee and what we've built.", delay: 3000 },
  { speaker: "Swadesh", role: "Co-founder", text: "Yeah. Every company has knowledge scattered everywhere — Notion, Slack, GitHub, PDFs. Nobody can use it in real time. We fix that.", delay: 18000 },
  { speaker: "Harsh",   role: "Co-founder", text: "We do it through the Neural Knowledge Graph. Connect a source, Cortex ingests it, maps relationships, and makes everything queryable instantly.", delay: 33000 },
  { speaker: "Swadesh", role: "Co-founder", text: "You can ask things like — what did we decide about pricing last month — and Cortex traces it to the exact doc, decision, and person.", delay: 50000 },
  { speaker: "Harsh",   role: "Co-founder", text: "The feature we're showing right now is Meeting Brain. Cortex joins as a silent observer and flags relevant context from the knowledge base in real time — as the conversation happens.", delay: 65000 },
  { speaker: "Swadesh", role: "Co-founder", text: "After the meeting, hit End and Analyze — Cortex generates a full report. Decisions, action items, open questions, follow-up email draft. All from Groq.", delay: 83000 },
  { speaker: "Harsh",   role: "Co-founder", text: "There's also SOP Autopilot. SOPs go stale — Cortex detects the drift automatically and flags which steps no longer match reality.", delay: 100000 },
  { speaker: "Swadesh", role: "Co-founder", text: "Superloyee is ambient intelligence. It doesn't change how you work — it just shows up with the right context when you need it.", delay: 115000 },
  { speaker: "Harsh",   role: "Co-founder", text: "Meeting Brain is the hook. The knowledge graph is the moat. That's the product.", delay: 130000 },
];

// ── Real-time AI suggestions triggered by specific lines ──────────────────────
const LINE_SUGGESTIONS: Record<number, { type: "insight" | "kb" | "flag" | "suggest"; title: string; body: string }> = {
  1: { type: "kb", title: "Knowledge Base Match", body: "Cortex found nodes matching 'knowledge graph' and 'Notion' across 3 connected sources. Relevant: Product Roadmap Q4, Confluence System Architecture v3." },
  3: { type: "suggest", title: "Suggested Talking Point", body: "Cross-source query example: 'What did we decide about the vector DB?' — Cortex traces this to GitHub ADR: Pinecone over Weaviate, and Confluence ADR: Vector DB Selection." },
  4: { type: "insight", title: "Groq Extraction Active", body: "PDF ingestion pipeline is live. Cortex processed uploaded documents using Groq Llama 3.3 70B. Semantic fidelity rated at 94% across last 12 sessions." },
  5: { type: "flag", title: "Meeting Brain Feature Referenced", body: "Real-time KB matching is active. Cortex is currently running this exact feature — flagging context from your connected sources as you speak." },
  7: { type: "kb", title: "SOP Autopilot Cross-Reference", body: "SOP: Engineer Onboarding (Slack/HR) has 2 stale steps detected. Cortex flagged drift from current tooling — relevant to the SOP Autopilot feature being discussed." },
  9: { type: "suggest", title: "Go-To-Market Framing", body: "Intercom data shows 'meeting intelligence' and 'real-time context' are top feature requests from Enterprise segment (112 mentions). This validates the Meeting Brain wedge strategy." },
  11: { type: "flag", title: "Action Item Detected", body: "Cortex logged: 'Finalize pitch deck with feature breakdown — Swadesh, end of week.' Will appear in post-meeting action items with high priority." },
  12: { type: "insight", title: "Onboarding Flow Reference", body: "No existing SOP found for 'user onboarding under 5 minutes.' This is a gap in the knowledge base — recommend creating one post-demo via SOP Autopilot." },
};

function buildKbContext(liveNodes: any[], connectedApps: string[]) {
  const lines: string[] = [`Connected: ${connectedApps.join(", ") || "none"}`];
  liveNodes.forEach(n => {
    lines.push(`- [${n.source}/${n.type}] ${n.label}${n.content ? `: ${n.content.slice(0, 120)}` : ""}`);
  });
  connectedApps.forEach(app => {
    SOURCE_SEEDS[app]?.nodes.forEach(n => {
      lines.push(`- [${app}/${n.type}] ${n.label}`);
    });
  });
  return lines.join("\n");
}

type MeetingPhase = "idle" | "joining" | "live" | "ending" | "analysis";

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

export default function MeetingBrainPage() {
  const { liveNodes, connectedApps } = useNeuralStore();

  const [phase, setPhase] = useState<MeetingPhase>("idle");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [visibleLines, setVisibleLines] = useState(0);
  const [wordCounts, setWordCounts] = useState<Record<number, number>>({});
  const [currentSuggestion, setCurrentSuggestion] = useState<(typeof LINE_SUGGESTIONS)[number] | null>(null);
  const [suggestionHistory, setSuggestionHistory] = useState<typeof LINE_SUGGESTIONS[number][]>([]);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const transcriptRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
  }, []);

  // Auto-scroll transcript
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [visibleLines]);

  const fakeJoin = () => {
    if (!meetingUrl.trim()) return;
    setApiError(false);
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setApiError(true);
    }, 2200);
  };

  const WORD_INTERVAL = 90; // ms per word

  const joinMeeting = () => {
    if (!meetingUrl.trim() && phase === "idle") return;
    setApiError(false);
    setPhase("joining");
    setVisibleLines(0);
    setWordCounts({});
    setSuggestionHistory([]);
    setCurrentSuggestion(null);
    setElapsedSecs(0);
    setAnalysis(null);

    // Bot "joins" after 2.5s
    const t = setTimeout(() => {
      setPhase("live");
      timerIntervalRef.current = setInterval(() => setElapsedSecs(s => s + 1), 1000);

      DEMO_LINES.forEach((line, idx) => {
        const words = line.text.split(" ");
        // Reveal the line bubble after delay
        const t2 = setTimeout(() => {
          setVisibleLines(v => v + 1);
          if (LINE_SUGGESTIONS[idx]) {
            const sug = LINE_SUGGESTIONS[idx];
            setCurrentSuggestion(sug);
            setSuggestionHistory(h => [sug, ...h].slice(0, 10));
          }
          // Stream words one by one
          words.forEach((_, wi) => {
            const tw = setTimeout(() => {
              setWordCounts(wc => ({ ...wc, [idx]: wi + 1 }));
            }, (wi + 1) * WORD_INTERVAL);
            timersRef.current.push(tw);
          });
        }, line.delay);
        timersRef.current.push(t2);
      });
    }, 2500);
    timersRef.current.push(t);
  };

  const endMeeting = async () => {
    clearAll();
    setPhase("ending");
    await new Promise(r => setTimeout(r, 800));
    setPhase("analysis");
    setIsAnalyzing(true);

    const fullTranscript = DEMO_LINES.slice(0, visibleLines)
      .map(l => `${l.speaker} (${l.role}): ${l.text}`)
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
    } catch {
      setAnalysis({ summary: "Analysis failed. Please try again.", decisions: [], actions: [], unresolved: [] });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    clearAll();
    setPhase("idle");
    setMeetingUrl("");
    setVisibleLines(0);
    setWordCounts({});
    setCurrentSuggestion(null);
    setSuggestionHistory([]);
    setElapsedSecs(0);
    setAnalysis(null);
    setIsAnalyzing(false);
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const sentimentColor = analysis?.sentiment === "positive" ? "text-white" : analysis?.sentiment === "negative" ? "text-white/50" : "text-white/70";

  return (
    <div className="flex h-screen flex-col bg-background antialiased">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-white/5 px-8 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight text-white uppercase">Meeting Brain</span>
          <div className="hidden md:flex h-8 w-[1px] bg-white/10 mx-2" />
          <Badge variant="outline" className="instrument-border text-white/40 label-sm">
            {phase === "idle" ? "STANDBY" : phase === "joining" ? "BOT_JOINING..." : phase === "live" ? "LIVE_SESSION" : phase === "ending" ? "ENDING..." : "POST_ANALYSIS"}
          </Badge>
        </div>
        {phase === "live" && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{formatTime(elapsedSecs)}</span>
            </div>
            <button
              onClick={endMeeting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all label-sm text-white/60 hover:text-white"
            >
              <PhoneOff className="h-3.5 w-3.5" />
              END & ANALYZE
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* ── IDLE: URL Input ── */}
          {phase === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex h-full items-center justify-center p-8"
            >
              <div className="w-full max-w-xl space-y-6">
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                    <Brain className="h-8 w-8 text-white/60" />
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Meeting Brain</h2>
                  <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed">
                    Paste your meeting URL. Cortex will join as a silent observer, track the conversation, and provide real-time intelligence from your knowledge base.
                  </p>
                </div>

                <div className="glass-panel border border-white/10 rounded-2xl p-6 space-y-4">
                  <div className="space-y-2">
                    <label className="label-sm text-white/40 uppercase tracking-[0.15em]">Meeting URL</label>
                    <div className="relative">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        value={meetingUrl}
                        onChange={e => setMeetingUrl(e.target.value)}
                        placeholder="https://meet.google.com/abc-defg-hij"
                        className="w-full bg-white/[0.03] border border-white/8 h-12 pl-12 pr-4 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-white/20"
                      />
                    </div>
                  </div>

                  <button
                    onClick={fakeJoin}
                    disabled={!meetingUrl.trim() || isConnecting}
                    className="w-full h-12 rounded-xl bg-white text-background font-black text-sm tracking-wider uppercase disabled:opacity-30 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                    {isConnecting ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />Connecting...</>
                    ) : (
                      <><Video className="h-4 w-4" />Deploy Cortex Bot</>
                    )}
                  </button>

                  {/* API Error banner */}
                  <AnimatePresence>
                    {apiError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">API_ERROR · 429 Rate Limit Exceeded</span>
                        </div>
                        <p className="text-[11px] text-red-300/60 font-mono leading-relaxed">
                          model: claude-sonnet-4-6<br />
                          org: superloyee-prod<br />
                          message: You have exceeded your current quota. Upgrade your plan or retry after reset.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Secret trigger — looks like a decorative divider */}
                <div className="flex items-center justify-center gap-2">
                  <div className="h-[1px] w-16 bg-white/5" />
                  <button
                    onClick={() => { if (meetingUrl.trim()) { setApiError(false); joinMeeting(); } }}
                    className="w-1.5 h-1.5 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                    title=""
                  />
                  <div className="h-[1px] w-16 bg-white/5" />
                </div>

                {/* KB Status */}
                <div className="flex items-center justify-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className={cn("h-1.5 w-1.5 rounded-full", liveNodes.length > 0 ? "bg-white" : "bg-white/20")} />
                    <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                      {liveNodes.length} Knowledge Nodes Active
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

          {/* ── JOINING: Bot animation ── */}
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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-3 rounded-full border border-dashed border-white/15"
                  />
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-6 rounded-full border border-dashed border-white/8"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-white font-bold text-lg tracking-tight">Cortex is Joining...</p>
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">ESTABLISHING_SECURE_OBSERVER_SESSION</p>
                </div>
                {["Connecting to meeting endpoint...", "Loading knowledge graph context...", "Activating real-time NLP engine..."].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.6 }}
                    className="flex items-center gap-3 justify-center"
                  >
                    <Loader2 className="h-3 w-3 text-white/30 animate-spin" />
                    <span className="text-[10px] text-white/40 font-mono">{step}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── LIVE: Transcript + Suggestions ── */}
          {phase === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full gap-0"
            >
              {/* Left: Transcript */}
              <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                <div className="px-6 py-3 border-b border-white/5 flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Live Transcript</span>
                  <span className="ml-auto text-[10px] font-mono text-white/20">{visibleLines} / {DEMO_LINES.length} lines</span>
                </div>

                <div ref={transcriptRef} className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-5">
                  <AnimatePresence>
                    {DEMO_LINES.slice(0, visibleLines).map((line, i) => {
                      const words = line.text.split(" ");
                      const revealed = wordCounts[i] ?? 0;
                      const isStreaming = revealed < words.length;
                      const displayText = words.slice(0, revealed).join(" ");
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex gap-4"
                        >
                          <div className="shrink-0 mt-1 w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center">
                            <span className="text-[9px] font-black text-white/40">{line.speaker[0]}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <span className="text-[11px] font-black text-white uppercase tracking-wide">{line.speaker}</span>
                              <span className="text-[9px] text-white/20 font-mono">{line.role}</span>
                            </div>
                            <p className="text-sm text-white/70 leading-relaxed">
                              {displayText}
                              {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-white/40 ml-0.5 align-middle animate-pulse rounded-sm" />}
                            </p>
                            {!isStreaming && LINE_SUGGESTIONS[i] && (
                              <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/8">
                                <Sparkles className="h-2.5 w-2.5 text-white/30" />
                                <span className="text-[9px] text-white/25 font-mono">Cortex flagged</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {visibleLines < DEMO_LINES.length && (
                    <div className="flex items-center gap-2 opacity-40">
                      <div className="w-8 h-8 rounded-full bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                        <span className="h-1 w-1 rounded-full bg-white animate-pulse" />
                      </div>
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                            animate={{ opacity: [0.3,1,0.3], y:[0,-3,0] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: i*0.18 }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Cortex Live Panel */}
              <div className="w-80 shrink-0 flex flex-col bg-background">
                <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
                  <Brain className="h-3.5 w-3.5 text-white/40" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Cortex Intelligence</span>
                </div>

                {/* Current suggestion */}
                <div className="p-4 border-b border-white/5">
                  <AnimatePresence mode="wait">
                    {currentSuggestion ? (
                      <motion.div
                        key={currentSuggestion.title}
                        initial={{ opacity: 0, y: 6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          {currentSuggestion.type === "kb" && <Network className="h-3 w-3 text-white/50" />}
                          {currentSuggestion.type === "insight" && <Sparkles className="h-3 w-3 text-white/50" />}
                          {currentSuggestion.type === "flag" && <AlertCircle className="h-3 w-3 text-white/50" />}
                          {currentSuggestion.type === "suggest" && <Zap className="h-3 w-3 text-white/50" />}
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-widest",
                            currentSuggestion.type === "flag" ? "text-white/70" : "text-white/40"
                          )}>{currentSuggestion.type === "kb" ? "KB MATCH" : currentSuggestion.type === "insight" ? "INSIGHT" : currentSuggestion.type === "flag" ? "SIGNAL" : "SUGGESTION"}</span>
                        </div>
                        <p className="text-[11px] font-bold text-white">{currentSuggestion.title}</p>
                        <p className="text-[11px] text-white/50 leading-relaxed">{currentSuggestion.body}</p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="waiting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 py-2"
                      >
                        <Activity className="h-3.5 w-3.5 text-white/15 animate-pulse" />
                        <span className="text-[10px] text-white/20">Monitoring conversation...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* History */}
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                  <p className="text-[9px] font-black text-white/15 uppercase tracking-widest mb-2">Previous Signals</p>
                  {suggestionHistory.slice(1).map((s, i) => (
                    <div key={i} className="flex items-start gap-2 opacity-50">
                      <div className="mt-0.5 w-1 h-1 rounded-full bg-white/30 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-white/50">{s.title}</p>
                        <p className="text-[9px] text-white/25 leading-relaxed line-clamp-2">{s.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* KB Status */}
                <div className="p-4 border-t border-white/5 space-y-2">
                  <p className="text-[9px] font-black text-white/15 uppercase tracking-widest">Active Memory</p>
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-white/20" />
                    <span className="text-[10px] text-white/30">{liveNodes.length} nodes · {connectedApps.length} sources</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── ENDING ── */}
          {phase === "ending" && (
            <motion.div
              key="ending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center"
            >
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 text-white/30 animate-spin mx-auto" />
                <p className="text-white font-bold">Ending session...</p>
                <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Finalizing transcript · Preparing analysis</p>
              </div>
            </motion.div>
          )}

          {/* ── ANALYSIS: Post-meeting intelligence panel ── */}
          {phase === "analysis" && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full overflow-y-auto no-scrollbar"
            >
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
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-bold text-white tracking-tight">Post-Meeting Intelligence</h2>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                        {DEMO_LINES.slice(0, visibleLines).length} transcript segments · Groq Llama 3.3 70B
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-white/8 text-white/30 hover:text-white/60 transition-all text-[10px] font-black uppercase tracking-widest">
                        <RotateCcw className="h-3 w-3" />
                        New Meeting
                      </button>
                    </div>
                  </div>

                  {/* Summary + Sentiment */}
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

                  {/* Stats row */}
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

                  {/* Decisions */}
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

                  {/* Actions */}
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

                  {/* Unresolved + KB Matches + Risk */}
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

                  {/* Follow-up draft */}
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

                  {/* Risk Flags */}
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
