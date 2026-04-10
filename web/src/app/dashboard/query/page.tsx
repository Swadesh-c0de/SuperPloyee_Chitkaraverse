"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Sparkles, BookOpen, GitBranch, Database,
  Hash, HardDrive, Globe, FileText, Activity,
  RotateCcw, Zap, Search, Layers,
  MessageSquare, Clock, ScanLine, Cpu, Network,
  CheckCircle2, Circle, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNeuralStore, useChatStore, type PersistedChatMessage, type PersistedRetrievedDoc } from "@/lib/store";
import { SOURCE_SEEDS } from "@/lib/neural-seed";

// ── Source icon map ──
const SOURCE_ICONS: Record<string, React.ElementType> = {
  GITHUB: GitBranch, NOTION: Database, SLACK: Hash,
  DRIVE: HardDrive, INTERCOM: Globe, JIRA: Activity,
  CONFLUENCE: FileText, MANUAL: FileText, INTERNAL: Cpu,
};

// ── Tool call phases ──
const TOOL_PHASES = [
  { id: "index",    label: "Indexing memory",       icon: ScanLine,  color: "text-white/50",  ms: 600  },
  { id: "retrieve", label: "Retrieving documents",  icon: Layers,    color: "text-white/60",  ms: 1800 },
  { id: "link",     label: "Linking concepts",      icon: Network,   color: "text-white/50",  ms: 900  },
  { id: "reason",   label: "Reasoning",             icon: Cpu,       color: "text-white/60",  ms: 700  },
];

const SOURCE_VERBS = [
  "Reading", "Parsing", "Scanning", "Extracting", "Analyzing", "Cross-referencing",
];

type ChatMessage = PersistedChatMessage;

interface TraceStep {
  verb: string;
  detail: string;
  source?: string;
  done: boolean;
}

type RetrievedDoc = PersistedRetrievedDoc;

interface ToolCallState {
  phase: "index" | "retrieve" | "link" | "reason" | "done";
  docs: RetrievedDoc[];
  visibleDocs: number;
  progress: number; // 0-100
}

const SUGGESTED_QUERIES = [
  "What are our key product decisions this quarter?",
  "Summarize all security policies from Notion",
  "What GitHub repositories are we tracking?",
  "What do our Jira tickets reveal about engineering velocity?",
];

function buildContext(connectedApps: string[], liveNodes: { id: string; label: string; type: string; source: string; content?: string }[]): string {
  if (connectedApps.length === 0 && liveNodes.length === 0) return "";
  const lines: string[] = [`Connected sources: ${connectedApps.join(", ")}`, ""];
  
  connectedApps.forEach(app => {
    const seed = SOURCE_SEEDS[app];
    if (!seed) return;
    lines.push(`### ${app}`);
    seed.nodes.forEach(n => {
      lines.push(`- [${n.type}] ${n.label}`);
      if (n.content) lines.push(`  Content: ${n.content}`);
    });
    lines.push("");
  });

  if (liveNodes.length > 0) {
    lines.push("### Live Knowledge Graph (including uploaded documents)");
    liveNodes.forEach(n => {
      lines.push(`- [${n.source}/${n.type}] ${n.label}`);
      if (n.content) lines.push(`  Content: ${n.content}`);
    });
  }
  return lines.join("\n");
}

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

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} gap-3`}
    >
      {!isUser && (
        <div className="mt-1 shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-white/70" />
        </div>
      )}
      <div className={`max-w-[78%] space-y-2`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-white text-background font-medium rounded-br-sm"
            : "bg-white/5 border border-white/8 text-white/85 rounded-bl-sm"
        }`}>
          {msg.content || <TypingDots />}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {msg.sources.map(s => (
              <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/40 font-mono">
                <BookOpen className="h-2.5 w-2.5" />
                {s}
              </span>
            ))}
          </div>
        )}
        <p className="text-[9px] text-white/20 px-1">
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {isUser && (
        <div className="mt-1 shrink-0 w-7 h-7 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
          <MessageSquare className="h-3.5 w-3.5 text-white/60" />
        </div>
      )}
    </motion.div>
  );
}

function ToolCallLoader({ state }: { state: ToolCallState }) {
  const phaseIdx = TOOL_PHASES.findIndex(p => p.id === state.phase);

  return (
    <div className="flex justify-start gap-3">
      <div className="mt-1 shrink-0 w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
        <motion.div
          animate={{ rotate: state.phase === "done" ? 0 : 360 }}
          transition={{ duration: 2, repeat: state.phase === "done" ? 0 : Infinity, ease: "linear" }}
        >
          <Sparkles className="h-3.5 w-3.5 text-white/70" />
        </motion.div>
      </div>

      <div className="flex-1 max-w-xl space-y-3">
        {/* Phase pipeline */}
        <div className="flex items-center gap-0">
          {TOOL_PHASES.map((phase, i) => {
            const Icon = phase.icon;
            const isDone = i < phaseIdx;
            const isActive = i === phaseIdx;
            return (
              <div key={phase.id} className="flex items-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.12 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
                    isDone
                      ? "bg-white/5 text-white/30"
                      : isActive
                      ? "bg-white/10 text-white/80 shadow-[0_0_12px_rgba(255,255,255,0.05)]"
                      : "text-white/15"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-3 w-3 text-white/30" />
                  ) : isActive ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Icon className="h-3 w-3" />
                    </motion.div>
                  ) : (
                    <Circle className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{phase.label}</span>
                </motion.div>
                {i < TOOL_PHASES.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-white/10 mx-0.5" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white/30 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${state.progress}%` }}
            transition={{ ease: "easeOut", duration: 0.4 }}
          />
        </div>

        {/* Retrieved document cards */}
        {state.docs.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
              Retrieving {state.docs.length} document{state.docs.length !== 1 ? "s" : ""}
            </p>
            <AnimatePresence>
              {state.docs.slice(0, state.visibleDocs).map((doc, i) => {
                const Icon = SOURCE_ICONS[doc.source] ?? FileText;
                return (
                  <motion.div
                    key={doc.name}
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.22 }}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/8 group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="shrink-0 w-5 h-5 rounded-md bg-white/8 flex items-center justify-center">
                        <Icon className="h-2.5 w-2.5 text-white/40" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] text-white/70 font-medium truncate">{doc.name}</p>
                        <p className="text-[9px] text-white/25 font-mono">{doc.source} · {doc.type}</p>
                      </div>
                    </div>
                    {/* Relevance bar */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-12 h-1 bg-white/8 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-white/40 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${doc.relevance}%` }}
                          transition={{ delay: 0.15, duration: 0.4 }}
                        />
                      </div>
                      <span className="text-[9px] text-white/25 font-mono w-7 text-right">{doc.relevance}%</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Status label */}
        <div className="flex items-center gap-2">
          <TypingDots />
          <span className="text-[11px] text-white/35">
            {state.phase === "index" && "Mapping your knowledge graph..."}
            {state.phase === "retrieve" && `Pulling ${state.docs.length > 0 ? state.visibleDocs + " of " + state.docs.length + " docs" : "relevant documents"}...`}
            {state.phase === "link" && "Linking related concepts across sources..."}
            {state.phase === "reason" && "Composing response..."}
          </span>
        </div>
      </div>
    </div>
  );
}

// Build the list of docs to "retrieve" from connected nodes
function buildRetrievalDocs(
  connectedApps: string[],
  liveNodes: { id: string; label: string; type: string; source: string }[]
): RetrievedDoc[] {
  const docs: RetrievedDoc[] = [];
  // From live nodes
  liveNodes.forEach(n => {
    docs.push({
      name: n.label,
      source: n.source,
      type: n.type,
      relevance: Math.floor(60 + Math.random() * 38),
    });
  });
  // Fill from seeds if not enough
  if (docs.length < 3) {
    connectedApps.forEach(app => {
      SOURCE_SEEDS[app]?.nodes.forEach(n => {
        if (!docs.find(d => d.name === n.label)) {
          docs.push({ name: n.label, source: app, type: n.type, relevance: Math.floor(55 + Math.random() * 40) });
        }
      });
    });
  }
  // Sort by relevance desc, take top 6
  return docs.sort((a, b) => b.relevance - a.relevance).slice(0, 6);
}

export default function QueryConsolePage() {
  const { connectedApps, liveNodes } = useNeuralStore();
  const {
    messages, traceHistory,
    addMessage, updateMessage, appendTraceHistory, clear: clearStore,
  } = useChatStore();
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolState, setToolState] = useState<ToolCallState | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, toolState]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;
    setInput("");

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    addMessage(userMsg);
    const history = [...messages, userMsg];
    setIsStreaming(true);
    clearTimers();

    // ── Phase 1: Index (600ms) ──
    const docs = buildRetrievalDocs(connectedApps, liveNodes);
    setToolState({ phase: "index", docs: [], visibleDocs: 0, progress: 8 });

    await new Promise<void>(r => schedule(r, 600));
    setToolState(s => s ? { ...s, progress: 22 } : s);

    // ── Phase 2: Retrieve docs (stagger each doc in) ──
    setToolState(s => s ? { ...s, phase: "retrieve", docs, visibleDocs: 0, progress: 28 } : s);
    const totalDocMs = Math.min(docs.length * 320, 1800);
    const docInterval = totalDocMs / Math.max(docs.length, 1);

    for (let i = 0; i < docs.length; i++) {
      await new Promise<void>(r => schedule(r, docInterval));
      setToolState(s => s ? {
        ...s,
        visibleDocs: i + 1,
        progress: 28 + Math.round(((i + 1) / docs.length) * 35),
      } : s);
    }

    // ── Phase 3: Link (900ms) ──
    await new Promise<void>(r => schedule(r, 200));
    setToolState(s => s ? { ...s, phase: "link", progress: 70 } : s);
    await new Promise<void>(r => schedule(r, 900));
    setToolState(s => s ? { ...s, progress: 82 } : s);

    // ── Phase 4: Reason — fire actual fetch ──
    setToolState(s => s ? { ...s, phase: "reason", progress: 88 } : s);

    const groqMessages = history.map(m => ({ role: m.role, content: m.content }));
    const context = buildContext(connectedApps, liveNodes);
    const assistantId = crypto.randomUUID();
    abortRef.current = new AbortController();
    let accumulated = "";
    let streamStarted = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: groqMessages, context }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error ?? `API error ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6).trim();
          if (payload === "[DONE]") break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.error) throw new Error(parsed.error);
            const { text } = parsed;
            if (!streamStarted) {
              streamStarted = true;
              setToolState(null);
              appendTraceHistory(docs);
              addMessage({
                id: assistantId,
                role: "assistant",
                content: "",
                timestamp: Date.now(),
              });
            }
            accumulated += text;
            updateMessage(assistantId, { content: accumulated });
          } catch (parseErr: any) {
            if (parseErr.message && !parseErr.message.startsWith("JSON")) throw parseErr;
          }
        }
      }

      // Parse [Source: ...] citations
      const sourceMatches = [...accumulated.matchAll(/\[Source:\s*([^\]]+)\]/g)];
      const sources = sourceMatches.map(m => m[1].trim()).filter((v, i, a) => a.indexOf(v) === i);
      if (sources.length > 0) {
        updateMessage(assistantId, { sources });
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setToolState(null);
        addMessage({
          id: assistantId,
          role: "assistant",
          content: `Something went wrong: ${e.message ?? "unknown error"}. Please try again.`,
          timestamp: Date.now(),
        });
      }
    } finally {
      setToolState(null);
      setIsStreaming(false);
    }
  }, [messages, isStreaming, connectedApps, liveNodes, clearTimers, schedule, addMessage, updateMessage, appendTraceHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearChat = () => {
    if (abortRef.current) abortRef.current.abort();
    clearTimers();
    clearStore();
    setInput("");
    setToolState(null);
  };

  const isEmpty = messages.length === 0 && !isStreaming && !toolState;

  return (
    <div className="flex h-screen bg-background antialiased overflow-hidden">
      {/* ── Main chat area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-white/5 px-6 shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-white/60" />
            <span className="text-sm font-bold tracking-widest text-white uppercase">Cortex Query</span>
            <div className="h-5 w-[1px] bg-white/10 mx-1" />
            <span className="text-[10px] text-white/25 font-mono uppercase tracking-widest">
              {connectedApps.length} source{connectedApps.length !== 1 ? "s" : ""} active
            </span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-all text-[10px] font-bold uppercase tracking-widest"
              >
                <RotateCcw className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-10 px-6 text-center">
              <div className="space-y-3">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white/70" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Ask your knowledge engine</h2>
                <p className="text-sm text-white/35 max-w-sm leading-relaxed">
                  {connectedApps.length === 0
                    ? "Connect data sources in Feed Sources, then ask anything about your company."
                    : `Cortex has access to ${connectedApps.join(", ")}. Ask anything.`}
                </p>
              </div>

              {/* Connected source chips */}
              {connectedApps.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                  {connectedApps.map(app => {
                    const Icon = SOURCE_ICONS[app] ?? FileText;
                    return (
                      <span key={app} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-[11px] text-white/50 font-mono">
                        <Icon className="h-3 w-3" />
                        {app}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Suggested queries */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
                {SUGGESTED_QUERIES.map(q => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="text-left p-4 rounded-xl border border-white/6 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/15 transition-all group"
                  >
                    <p className="text-[12px] text-white/40 group-hover:text-white/70 transition-colors leading-relaxed">{q}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              <AnimatePresence>
                {toolState && (
                  <motion.div
                    key="toolcall"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.25 }}
                  >
                    <ToolCallLoader state={toolState} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 px-6 pb-6 pt-3 border-t border-white/5 bg-background/80 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition-colors">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={connectedApps.length === 0 ? "Connect a data source first..." : "Ask anything about your connected knowledge..."}
                disabled={isStreaming}
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 resize-none focus:outline-none leading-relaxed min-h-[24px] max-h-[140px] overflow-y-auto no-scrollbar"
                style={{ fieldSizing: "content" } as React.CSSProperties}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={isStreaming || !input.trim()}
                className="shrink-0 w-8 h-8 rounded-xl bg-white text-background flex items-center justify-center hover:opacity-90 disabled:opacity-20 transition-opacity"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-white/15 text-center mt-2 font-mono">
              SHIFT+ENTER for new line · ENTER to send
            </p>
          </div>
        </div>
      </div>

      {/* ── Reasoning trace sidebar ── */}
      <aside className="w-72 shrink-0 border-l border-white/5 flex flex-col bg-background">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Reasoning Trace</span>
          <Clock className="h-3 w-3 text-white/20" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-6">
          {/* Active tool call progress in sidebar */}
          {isStreaming && toolState && (
            <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Active</p>
              <div className="space-y-2">
                {TOOL_PHASES.map((phase, i) => {
                  const phaseIdx = TOOL_PHASES.findIndex(p => p.id === toolState.phase);
                  const isDone = i < phaseIdx;
                  const isActive = i === phaseIdx;
                  const Icon = phase.icon;
                  return (
                    <motion.div
                      key={phase.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: isDone ? 0.35 : isActive ? 1 : 0.2, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-2"
                    >
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                        isDone ? "bg-white/5" : isActive ? "bg-white/12" : "bg-transparent"
                      }`}>
                        {isDone ? (
                          <CheckCircle2 className="h-2.5 w-2.5 text-white/30" />
                        ) : isActive ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}>
                            <Icon className="h-2.5 w-2.5 text-white/70" />
                          </motion.div>
                        ) : (
                          <Circle className="h-2.5 w-2.5 text-white/15" />
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-white/60">{phase.label}</p>
                    </motion.div>
                  );
                })}
                <div className="mt-2 h-[2px] bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/25 rounded-full"
                    animate={{ width: `${toolState.progress}%` }}
                    transition={{ ease: "easeOut", duration: 0.4 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Per-query doc retrieval history */}
          {traceHistory.length > 0 && (
            <div>
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Retrieved</p>
              <div className="space-y-4">
                {[...traceHistory].reverse().map((docs, ti) => (
                  <div key={ti} className="space-y-1.5 border-l border-white/8 pl-3">
                    {docs.slice(0, 3).map((doc, di) => {
                      const Icon = SOURCE_ICONS[doc.source] ?? FileText;
                      return (
                        <div key={di} className="flex items-center gap-1.5">
                          <Icon className="h-2.5 w-2.5 text-white/20 shrink-0" />
                          <span className="text-[9px] text-white/30 truncate">{doc.name}</span>
                        </div>
                      );
                    })}
                    {docs.length > 3 && (
                      <p className="text-[9px] text-white/15 pl-4">+{docs.length - 3} more</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isStreaming && traceHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Activity className="h-6 w-6 text-white/10" />
              <p className="text-[9px] text-white/20 uppercase tracking-widest font-black leading-relaxed max-w-[160px]">
                Retrieved documents will appear here
              </p>
            </div>
          )}
        </div>

        {/* Connected sources */}
        <div className="px-5 py-4 border-t border-white/5 space-y-2">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-3">Connected Sources</p>
          {connectedApps.length === 0 ? (
            <p className="text-[10px] text-white/20">No sources connected</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {connectedApps.map(app => {
                const Icon = SOURCE_ICONS[app] ?? FileText;
                const nodeCount = SOURCE_SEEDS[app]?.nodes.length ?? 0;
                return (
                  <div key={app} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/8">
                    <Icon className="h-2.5 w-2.5 text-white/40" />
                    <span className="text-[9px] text-white/40 font-mono">{app}</span>
                    <span className="text-[9px] text-white/20">{nodeCount}n</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
