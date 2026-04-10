"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNeuralStore } from "@/lib/store";
import { SOURCE_SEEDS, CUSTOMER_INTEL_DATA } from "@/lib/neural-seed";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, TrendingUp, TrendingDown,
  ArrowRight, Zap, Database, Network, Cpu, ScanLine, Layers,
  FileText, GitBranch, BookOpen, Brain,
  BarChart3, Users, Star, Shield, Play,
  ChevronDown, RotateCcw, Sparkles,
  TicketCheck, DollarSign, Activity,
  MessageSquare, X, Send, Loader2, Bot, User,
} from "lucide-react";

// ── Analysis phases (tool-call animation) ──────────────────────────────────
const ANALYSIS_PHASES = [
  { id: "ingest",   label: "Ingesting Trello boards",        icon: Database,  detail: "reading 24 support cards + 8 deals…" },
  { id: "classify", label: "Classifying ticket categories",  icon: ScanLine,  detail: "tagging priority, type, sentiment…" },
  { id: "link",     label: "Cross-linking knowledge nodes",  icon: Network,   detail: "connecting to Notion + GitHub data…" },
  { id: "pattern",  label: "Detecting issue patterns",       icon: Cpu,       detail: "clustering recurring complaints…" },
  { id: "sales",    label: "Scoring sales pipeline risks",   icon: TrendingUp,detail: "probability-weighting open deals…" },
  { id: "insight",  label: "Generating intelligence report", icon: Brain,     detail: "synthesising Cortex metrics…" },
];

const RETRIEVAL_DOCS = [
  { name: "Trello: Support Board",     source: "TRELLO",     icon: TicketCheck },
  { name: "Trello: Sales Pipeline",    source: "TRELLO",     icon: DollarSign },
  { name: "Notion: Customer Handbook", source: "NOTION",     icon: BookOpen },
  { name: "GitHub: API Changelog",     source: "GITHUB",     icon: GitBranch },
  { name: "Jira: P0 Blockers",         source: "JIRA",       icon: AlertTriangle },
  { name: "Slack: #customer-success",  source: "SLACK",      icon: Activity },
];

// ── AI Resolution mock outcomes ─────────────────────────────────────────────
const RESOLUTION_OUTCOMES: Record<string, { resolution: "auto" | "human"; note: string }> = {
  "TKT-001": { resolution: "human", note: "Escalated to billing team — refund > $500 requires approval" },
  "TKT-002": { resolution: "human", note: "Raised to Dev Team — SSO config requires manual intervention" },
  "TKT-003": { resolution: "auto",  note: "Auto-resolved: rate limit reset applied, customer notified" },
  "TKT-004": { resolution: "auto",  note: "Auto-resolved: Firefox cache-clear guide sent to customer" },
  "TKT-005": { resolution: "auto",  note: "Auto-resolved: null row filter deployed, CSV re-generated" },
  "TKT-006": { resolution: "human", note: "Raised to Dev Team — webhook event schema mismatch detected" },
  "TKT-007": { resolution: "auto",  note: "Auto-resolved: SPF/DKIM records updated, monitoring active" },
  "TKT-008": { resolution: "human", note: "Raised to Dev Team — performance regression under investigation" },
  "TKT-009": { resolution: "human", note: "Critical: Raised to Dev Team — 2FA loop blocks all users" },
  "TKT-010": { resolution: "auto",  note: "Auto-resolved: audit log backfill triggered, entries synced" },
  "TKT-011": { resolution: "auto",  note: "Auto-resolved: seat count recalculation queued + confirmed" },
  "TKT-012": { resolution: "human", note: "Raised to Dev Team — query plan analysis required" },
};

// ── Priority config ──────────────────────────────────────────────────────────
const PRIORITY = {
  critical: { label: "Critical", dot: "bg-white",      text: "text-white" },
  high:     { label: "High",     dot: "bg-white/60",   text: "text-white/70" },
  medium:   { label: "Medium",   dot: "bg-white/30",   text: "text-white/40" },
  low:      { label: "Low",      dot: "bg-white/15",   text: "text-white/25" },
};

const STAGE_LABELS: Record<string, string> = {
  "Discovery":     "bg-white/5  text-white/40",
  "Demo Done":     "bg-white/8  text-white/50",
  "Proposal Sent": "bg-white/10 text-white/60",
  "Negotiation":   "bg-white/15 text-white/70",
  "Closed Won":    "bg-white    text-background",
};

function TypingDots() {
  return (
    <div className="flex items-center gap-0.5">
      {[0,1,2].map(i => (
        <motion.div key={i} className="w-1 h-1 rounded-full bg-white/40"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function CustomerIntelligencePage() {
  const { isAppConnected, connectApp, addSyncLog, commitPending } = useNeuralStore();
  const isTrelloConnected = isAppConnected("TRELLO");

  const [mounted, setMounted] = useState(false);
  // view: "connect" | "data" | "analyzing" | "dashboard" | "resolving" | "resolved"
  const [view, setView] = useState<"connect"|"data"|"analyzing"|"dashboard"|"resolving"|"resolved">("connect");
  const [connecting, setConnecting] = useState(false);
  const [activeTab, setActiveTab] = useState<"tickets"|"sales">("tickets");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [visibleDocs, setVisibleDocs] = useState(0);
  const [progress, setProgress] = useState(0);
  const [resolvePhase, setResolvePhase] = useState(0);
  const [resolveProgress, setResolveProgress] = useState(0);
  const [groqIntel, setGroqIntel] = useState<any>(null);
  const [groqResolutions, setGroqResolutions] = useState<any>(null);
  const [groqError, setGroqError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string; actionResults?: string[] }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const [liveTrelloData, setLiveTrelloData] = useState<{
    supportTickets: any[];
    salesPipeline: any[];
    rawCards: any[];
  }>({ supportTickets: [], salesPipeline: [], rawCards: [] });
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  // Fetch live Trello data (runs on mount if already connected, or after handleConnect sets data)
  const fetchLiveTrello = useCallback(async () => {
    try {
      const res = await fetch("/api/trello?action=all");
      const json = await res.json();
      if (json.error) return;

      const allCards: any[] = [];
      const supportTickets: any[] = [];
      const salesPipeline: any[] = [];

      for (const { board, lists, cards } of json.boardData) {
        const listMap: Record<string, string> = {};
        for (const l of lists) listMap[l.id] = l.name;

        for (const card of cards) {
          allCards.push({ ...card, boardName: board.name, listName: listMap[card.idList] ?? "Unknown" });
          const listName = (listMap[card.idList] ?? "").toLowerCase();
          const labels = card.labels?.map((l: any) => (l.name || l.color)).join(", ") ?? "";
          const isResolved = listName.includes("done") || listName.includes("resolv") || listName.includes("closed") || listName.includes("won");
          const isInProgress = listName.includes("progress") || listName.includes("doing") || listName.includes("review");

          const isSalesDeal =
            listName.includes("discovery") || listName.includes("demo") ||
            listName.includes("proposal") || listName.includes("negotiat") ||
            listName.includes("pipeline") || listName.includes("lead") ||
            (board.name ?? "").toLowerCase().includes("sale") ||
            (board.name ?? "").toLowerCase().includes("pipeline") ||
            (board.name ?? "").toLowerCase().includes("crm");

          if (isSalesDeal) {
            salesPipeline.push({
              id: card.id,
              company: card.name,
              value: 0,
              stage: listMap[card.idList] ?? "Unknown",
              probability: isResolved ? 100 : isInProgress ? 70 : 50,
              owner: "—",
              lastActivity: card.dateLastActivity
                ? new Date(card.dateLastActivity).toLocaleDateString()
                : "—",
              notes: card.desc?.slice(0, 120) || labels || "—",
              shortUrl: card.shortUrl,
              _cardId: card.id,
            });
          } else {
            const labelLower = labels.toLowerCase();
            const priority =
              labelLower.includes("critical") || labelLower.includes("p0") ? "critical" :
              labelLower.includes("high")     || labelLower.includes("p1") ? "high" :
              labelLower.includes("medium")   || labelLower.includes("p2") ? "medium" : "low";
            supportTickets.push({
              id: card.id.slice(-6).toUpperCase(),
              title: card.name,
              priority,
              status: isResolved ? "resolved" : isInProgress ? "in_progress" : "open",
              customer: board.name,
              category: labels || listMap[card.idList] || "General",
              created: card.dateLastActivity
                ? new Date(card.dateLastActivity).toLocaleDateString()
                : "—",
              assignee: "—",
              notes: card.desc?.slice(0, 200) || "—",
              shortUrl: card.shortUrl,
              _cardId: card.id,
            });
          }
        }
      }

      setLiveTrelloData({ supportTickets, salesPipeline, rawCards: allCards });
    } catch {
      // silently fail — UI will show empty state
    }
  }, []);

  // Sync with persisted state on mount — also sets mounted to unblock render
  useEffect(() => {
    setMounted(true);
    if (isTrelloConnected) {
      setView("dashboard");
      fetchLiveTrello();
    }
  }, []);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (chatOpen) setTimeout(() => chatInputRef.current?.focus(), 100);
  }, [chatOpen]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatLoading]);

  const buildTrelloContext = useCallback(() => {
    const tickets = liveTrelloData.supportTickets;
    const deals = liveTrelloData.salesPipeline;
    const boards = Array.from(new Set(liveTrelloData.rawCards.map((c: any) => c.boardName)));
    return [
      `Boards: ${boards.join(", ") || "(none loaded)"}`,
      ``,
      `SUPPORT TICKETS (${tickets.length}):`,
      ...tickets.map((t: any) => `- [${t._cardId}] ${t.title} | list: ${t.category} | priority: ${t.priority} | status: ${t.status}`),
      ``,
      `SALES/PIPELINE CARDS (${deals.length}):`,
      ...deals.map((d: any) => `- [${d._cardId}] ${d.company} | list: ${d.stage}`),
    ].join("\n");
  }, [liveTrelloData]);

  const sendChatMessage = useCallback(async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const userMsg = { role: "user" as const, content: text };
    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/trello-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(m => ({ role: m.role, content: m.content })),
          trelloContext: buildTrelloContext(),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: data.text, actionResults: data.actionResults },
      ]);
      if (data.actionResults?.length) await fetchLiveTrello();
    } catch (err: any) {
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: `Error: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [chatInput, chatLoading, chatMessages, buildTrelloContext, fetchLiveTrello]);

  // ── Connect Trello ──
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/trello?action=all");
      const json = await res.json();
      if (json.error) throw new Error(json.error);

      await fetchLiveTrello();

      connectApp("TRELLO");
      const seed = SOURCE_SEEDS.TRELLO;
      addSyncLog({
        ...seed.syncLog,
        description: `Cards ingested from real Trello boards.`,
        impact: json.boardData.map((b: any) => b.board.name).slice(0, 4),
      });
      commitPending(seed.nodes, seed.links);
      setConnecting(false);
      setView("data");
    } catch (err: any) {
      console.error("Trello connect error:", err);
      setConnecting(false);
    }
  };

  // ── Start analysis animation + fire Groq analyze ──
  const startAnalysis = () => {
    setView("analyzing");
    setPhaseIdx(0); setVisibleDocs(0); setProgress(0); setGroqError(null);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const durs = [600, 900, 700, 1000, 800, 700];
    let elapsed = 0;
    durs.forEach((d, i) => {
      schedule(() => {
        setPhaseIdx(i);
        setProgress(Math.round(((i + 1) / ANALYSIS_PHASES.length) * 80));
      }, elapsed);
      elapsed += d;
    });
    RETRIEVAL_DOCS.forEach((_, i) => {
      schedule(() => setVisibleDocs(i + 1), 400 + i * 350);
    });

    // Fire Groq analyze in parallel
    fetch("/api/customer-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "analyze", tickets: liveTrelloData.supportTickets, deals: liveTrelloData.salesPipeline }),
    })
      .then(r => r.json())
      .then(data => { if (!data.error) setGroqIntel(data); })
      .catch(() => {});

    schedule(() => {
      setProgress(100);
      setTimeout(() => setView("dashboard"), 500);
    }, elapsed + 400);
  };

  // ── AI Resolution — fires Groq resolve, animates, then transitions to resolved view ──
  const RESOLVE_PHASES = [
    "Scanning all open tickets…",
    "Classifying auto-resolvable issues…",
    "Drafting responses & actions…",
    "Escalating human-required tickets…",
    "Finalising resolution report…",
  ];

  const runAiResolution = () => {
    setView("resolving");
    setResolvePhase(0); setResolveProgress(0); setGroqError(null);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // Animate resolution phases
    const phaseDurs = [600, 800, 700, 600, 500];
    let elapsed = 0;
    phaseDurs.forEach((d, i) => {
      schedule(() => {
        setResolvePhase(i);
        setResolveProgress(Math.round(((i + 1) / RESOLVE_PHASES.length) * 80));
      }, elapsed);
      elapsed += d;
    });

    // Fire Groq resolve in parallel
    fetch("/api/customer-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "resolve", tickets: liveTrelloData.supportTickets }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.error) {
          setGroqResolutions(data);
          // Post resolution comments back to Trello
          if (data.resolutions) {
            const ticketMap: Record<string, string> = {};
            for (const t of liveTrelloData.supportTickets) {
              ticketMap[t.id] = t._cardId;
            }
            for (const r of data.resolutions) {
              const cardId = ticketMap[r.id];
              if (cardId) {
                const comment = `🤖 Cortex AI [${r.resolution === "auto" ? "Auto-Resolved" : "Escalated"}]: ${r.action}\n${r.note}`;
                fetch("/api/trello", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "add-comment", cardId, text: comment }),
                }).catch(() => {});
              }
            }
          }
        } else {
          setGroqError("Resolution failed");
        }
      })
      .catch(() => setGroqError("Network error — showing mock data"));

    schedule(() => {
      setResolveProgress(100);
      setTimeout(() => setView("resolved"), 500);
    }, elapsed + 400);
  };

  if (!mounted) return null;

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: CONNECT
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "connect" && !isTrelloConnected) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-10 text-center"
        >
          <div className="space-y-5">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-white/50" fill="currentColor">
                <path d="M21 7.5C21 5.57 19.43 4 17.5 4H6.5C4.57 4 3 5.57 3 7.5v9C3 18.43 4.57 20 6.5 20H17.5C19.43 20 21 18.43 21 16.5v-9zm-12.5.5h3v4.5h-3V8zm4.5 6h-4.5v-1H13V8h2v6h-2zm5-1.5h-3V8h3v4.5z"/>
              </svg>
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Connect Trello</h1>
              <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto">
                Cortex will ingest your Support and Sales boards, analyze ticket patterns, and generate real-time customer intelligence.
              </p>
            </div>
          </div>

          <div className="space-y-3 text-left">
            {[
              "24 support tickets across 5 categories",
              "8 active sales deals with probability scoring",
              "AI pattern detection across all ticket types",
              "Cross-linked with Notion, GitHub & Jira data",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-[12px] text-white/50">
                <CheckCircle2 className="h-3.5 w-3.5 text-white/30 shrink-0" />
                {item}
              </div>
            ))}
          </div>

          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full h-12 bg-white text-background text-[11px] font-black uppercase tracking-widest hover:opacity-90 gap-2"
          >
            {connecting ? (
              <>
                <motion.div className="w-3 h-3 border-2 border-background/40 border-t-background rounded-full"
                  animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                Connecting…
              </>
            ) : (
              <>Connect Trello <ArrowRight className="h-3.5 w-3.5" /></>
            )}
          </Button>

          <p className="text-[10px] text-white/20 font-mono">Connects to your real Trello workspace</p>
        </motion.div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: RAW DATA
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "data") {
    const tickets = liveTrelloData.supportTickets;
    const deals   = liveTrelloData.salesPipeline;

    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-14 items-center justify-between border-b border-white/5 px-8 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
              <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">Trello Connected</span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <span className="text-[10px] font-mono text-white/20">{tickets.length} tickets · {deals.length} deals ingested</span>
          </div>
          <Button
            onClick={startAnalysis}
            className="bg-white text-background text-[10px] font-black h-8 px-4 uppercase tracking-widest gap-1.5 hover:opacity-90"
          >
            <Brain className="h-3 w-3" /> Run Cortex Analysis
          </Button>
        </header>

        <div className="flex-1 overflow-auto no-scrollbar p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-0 border-b border-white/6">
            {[
              { id: "tickets", label: `Support Tickets (${tickets.length})` },
              { id: "sales",   label: `Sales Pipeline (${deals.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as "tickets"|"sales")}
                className={cn(
                  "px-5 py-2.5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all",
                  activeTab === tab.id ? "border-white text-white" : "border-transparent text-white/25 hover:text-white/50"
                )}
              >{tab.label}</button>
            ))}
          </div>

          {/* Tickets table */}
          {activeTab === "tickets" && (
            <div className="space-y-1.5">
              {/* Header */}
              <div className="grid grid-cols-[80px_1fr_90px_110px_110px_100px_90px] gap-4 px-4 py-2">
                {["ID","Title","Priority","Status","Customer","Category","Assignee"].map(h => (
                  <span key={h} className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{h}</span>
                ))}
              </div>
              {tickets.map((t, i) => {
                const p = PRIORITY[t.priority as keyof typeof PRIORITY] ?? PRIORITY.low;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-[80px_1fr_90px_110px_110px_100px_90px] gap-4 items-center px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
                  >
                    <span className="text-[10px] font-mono text-white/30">{t.id}</span>
                    <span className="text-[12px] font-medium text-white/80 truncate">{t.title}</span>
                    <div className="flex items-center gap-1.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.dot)} />
                      <span className={cn("text-[10px] font-bold", p.text)}>{p.label}</span>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block",
                      t.status === "open"        ? "bg-white/8  text-white/60" :
                      t.status === "in_progress" ? "bg-white/15 text-white/80" :
                                                   "bg-white/5  text-white/30"
                    )}>{t.status.replace("_"," ")}</span>
                    <span className="text-[11px] text-white/50 truncate">{t.customer}</span>
                    <span className="text-[10px] text-white/35">{t.category}</span>
                    <span className="text-[10px] text-white/30 truncate">{t.assignee}</span>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Sales pipeline */}
          {activeTab === "sales" && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[90px_1fr_110px_110px_80px_120px_1fr] gap-4 px-4 py-2">
                {["ID","Company","Value","Stage","Prob.","Owner","Notes"].map(h => (
                  <span key={h} className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{h}</span>
                ))}
              </div>
              {deals.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="grid grid-cols-[90px_1fr_110px_110px_80px_120px_1fr] gap-4 items-center px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
                >
                  <span className="text-[10px] font-mono text-white/30">{d.id}</span>
                  <span className="text-[12px] font-bold text-white/80">{d.company}</span>
                  <span className="text-[12px] font-black text-white">${(d.value/1000).toFixed(0)}k</span>
                  <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full inline-block", STAGE_LABELS[d.stage] ?? "bg-white/5 text-white/30")}>
                    {d.stage}
                  </span>
                  <span className="text-[12px] font-black text-white/70">{d.probability}%</span>
                  <span className="text-[11px] text-white/40">{d.owner}</span>
                  <span className="text-[10px] text-white/30 truncate">{d.notes}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: ANALYZING
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "analyzing") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-2xl space-y-10">
          <div className="space-y-3">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Cortex is analyzing your data</p>
            {ANALYSIS_PHASES.map((phase, i) => {
              const Icon = phase.icon;
              const done   = i < phaseIdx;
              const active = i === phaseIdx;
              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: active || done ? 1 : 0.2, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <div className={cn(
                    "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                    done   ? "bg-white border-white" :
                    active ? "bg-white/10 border-white/30 animate-pulse" :
                             "bg-white/[0.03] border-white/8"
                  )}>
                    {done
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-background" />
                      : <Icon className={cn("h-3.5 w-3.5", active ? "text-white" : "text-white/20")} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn("text-[11px] font-bold", active ? "text-white" : done ? "text-white/40" : "text-white/20")}>
                        {phase.label}
                      </span>
                      {active && <TypingDots />}
                    </div>
                    {active && <p className="text-[10px] text-white/30 font-mono">{phase.detail}</p>}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Retrieving from knowledge base</p>
            <div className="grid grid-cols-2 gap-2">
              {RETRIEVAL_DOCS.slice(0, visibleDocs).map((doc, i) => {
                const Icon = doc.icon;
                return (
                  <motion.div
                    key={doc.name}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/8"
                  >
                    <Icon className="h-3 w-3 text-white/30 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-white/60 truncate">{doc.name}</p>
                      <p className="text-[9px] text-white/20 font-mono">{doc.source}</p>
                    </div>
                    <motion.div className="w-1.5 h-1.5 rounded-full bg-white/40"
                      animate={{ opacity: [0.3,1,0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-mono text-white/20">
              <span>Building intelligence report…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full"
                animate={{ width: `${progress}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: RESOLVING ANIMATION
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "resolving") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-xl space-y-10">
          <div className="space-y-2">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Cortex AI Resolution Engine</p>
            <h2 className="text-xl font-black text-white">Resolving {liveTrelloData.supportTickets.length} tickets…</h2>
          </div>

          <div className="space-y-3">
            {RESOLVE_PHASES.map((label, i) => {
              const done   = i < resolvePhase;
              const active = i === resolvePhase;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: active || done ? 1 : 0.2, x: 0 }}
                  transition={{ delay: i * 0.05 }} className="flex items-center gap-3"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                    done   ? "bg-white border-white" :
                    active ? "bg-white/10 border-white/30 animate-pulse" :
                             "bg-white/[0.03] border-white/8"
                  )}>
                    {done
                      ? <CheckCircle2 className="h-3 w-3 text-background" />
                      : <Sparkles className={cn("h-3 w-3", active ? "text-white" : "text-white/20")} />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] font-bold", active ? "text-white" : done ? "text-white/40" : "text-white/20")}>
                      {label}
                    </span>
                    {active && <TypingDots />}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-mono text-white/20">
              <span>Processing via Groq llama-3.3-70b…</span>
              <span>{resolveProgress}%</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div className="h-full bg-white rounded-full"
                animate={{ width: `${resolveProgress}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: RESOLVED — final processed dashboard
  // ═══════════════════════════════════════════════════════════════════════════
  if (view === "resolved") {
    const tickets   = liveTrelloData.supportTickets;
    const deals     = liveTrelloData.salesPipeline;
    const intel     = CUSTOMER_INTEL_DATA;
    const resData   = groqResolutions;
    const resMap: Record<string, { resolution: string; note: string; action: string }> = {};
    if (resData?.resolutions) {
      for (const r of resData.resolutions) resMap[r.id] = r;
    }
    const summaryRaw = resData?.summary ?? { autoCount: 7, humanCount: 5, automationRate: 58, timeSavedMinutes: 140 };
    // Handle both whole numbers (58) and decimals (0.58)
    const automationRate = summaryRaw.automationRate < 1 ? summaryRaw.automationRate * 100 : summaryRaw.automationRate;
    const summary = { ...summaryRaw, automationRate };

    const totalPipeline = deals.reduce((s: number, d: any) => s + d.value, 0);
    const atRisk    = groqIntel?.atRiskDeals ?? [];
    const patterns  = groqIntel?.topPatterns ?? [];
    const actions   = groqIntel?.recommendedActions ?? [];

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-40 flex items-center justify-between h-14 border-b border-white/5 bg-background/90 backdrop-blur-xl px-8">
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">Resolution Report</span>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-white/40" />
              <span className="text-[9px] font-mono text-white/25 uppercase">Groq · Processed</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setView("dashboard")}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest font-bold flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" /> Dashboard
            </button>
            <button onClick={() => setView("data")}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest font-bold flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Raw Data
            </button>
          </div>
        </div>

        <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">
          {/* Resolution stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Auto-Resolved",     value: String(summary.autoCount),           sub: "By Cortex AI" },
              { label: "Escalated to Human",value: String(summary.humanCount),          sub: "Require manual action" },
              { label: "Automation Rate",   value: `${Math.round(summary.automationRate)}%`,        sub: "Of tickets handled by AI" },
              { label: "Time Saved",        value: `${summary.timeSavedMinutes}m`,      sub: "Estimated agent time" },
            ].map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl border border-white/8 bg-white/[0.02] space-y-3"
              >
                <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-3xl font-black text-white">{stat.value}</p>
                <p className="text-[10px] text-white/30">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Resolved ticket list */}
            <div className="lg:col-span-2 space-y-2">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Ticket Resolutions</p>
              {tickets.map((t, i) => {
                const p    = PRIORITY[t.priority as keyof typeof PRIORITY] ?? PRIORITY.low;
                const res  = resMap[t.id];
                const isAuto = res?.resolution === "auto";
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border transition-all",
                      isAuto ? "border-white/15 bg-white/[0.03]" : "border-white/8 bg-white/[0.01]"
                    )}
                  >
                    <div className="flex items-center gap-2 w-[88px] shrink-0 pt-0.5">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.dot)} />
                      <span className="text-[9px] font-mono text-white/30">{t.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white/80 leading-snug">{t.title}</p>
                      {res && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 + i * 0.02 }}
                          className="mt-1.5 flex items-start gap-1.5">
                          {isAuto
                            ? <CheckCircle2 className="h-3 w-3 text-white/50 shrink-0 mt-0.5" />
                            : <AlertTriangle className="h-3 w-3 text-white/35 shrink-0 mt-0.5" />}
                          <div>
                            <p className="text-[10px] font-bold text-white/50">{res.action}</p>
                            <p className="text-[10px] text-white/30 leading-relaxed">{res.note}</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                      isAuto ? "bg-white/15 text-white/70" : "bg-white/8 text-white/40"
                    )}>
                      {isAuto ? "Auto" : "Escalated"}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Right: patterns + actions + at-risk */}
            <div className="space-y-5">
              {/* Issue patterns */}
              {patterns.length > 0 && (
                <div className="p-5 rounded-2xl border border-white/8 bg-white/[0.02] space-y-3">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Issue Patterns</p>
                  {patterns.map((p: any, i: number) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white/70 truncate">{p.pattern}</p>
                        <p className={cn("text-[9px] font-black uppercase",
                          p.severity === "critical" ? "text-white/60" :
                          p.severity === "high"     ? "text-white/40" : "text-white/25"
                        )}>{p.severity}</p>
                      </div>
                      <span className="text-[13px] font-black text-white/50 ml-3">{p.count}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended actions */}
              {actions.length > 0 && (
                <div className="p-5 rounded-2xl border border-white/8 bg-white/[0.02] space-y-3">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Recommended Actions</p>
                  {actions.map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
                        a.priority === "immediate" ? "bg-white" :
                        a.priority === "soon"      ? "bg-white/50" : "bg-white/20"
                      )} />
                      <p className="text-[11px] text-white/60 leading-relaxed">{a.action}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* At-risk deals */}
              {atRisk.length > 0 && (
                <div className="p-5 rounded-2xl border border-white/8 bg-white/[0.02] space-y-3">
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">At-Risk Deals</p>
                  {atRisk.map((d: any, i: number) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-[11px] font-bold text-white/70">{d.company}</p>
                      <p className="text-[10px] text-white/35">{d.reason}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Automation bar */}
              <div className="p-5 rounded-2xl border border-white/15 bg-white/[0.02] space-y-3">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Automation Rate</p>
                <p className="text-3xl font-black text-white">{Math.round(summary.automationRate)}%</p>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${Math.round(summary.automationRate)}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white/50 rounded-full" />
                </div>
                <p className="text-[9px] text-white/25 font-mono">{summary.timeSavedMinutes} min saved · {summary.autoCount} auto · {summary.humanCount} human</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VIEW: DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  const intel   = CUSTOMER_INTEL_DATA;
  const tickets = liveTrelloData.supportTickets;
  const deals   = liveTrelloData.salesPipeline;
  const openTickets      = tickets.filter(t => t.status !== "resolved").length;
  const criticalTickets  = tickets.filter(t => t.priority === "critical").length;
  const totalPipeline    = deals.reduce((s, d) => s + d.value, 0);
  const closedWon        = deals.filter(d => d.stage === "Closed Won").reduce((s, d) => s + d.value, 0);

  const ChatPanel = (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setChatOpen(o => !o)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl border flex items-center justify-center transition-all shadow-2xl",
          chatOpen
            ? "bg-white text-background border-white"
            : "bg-background/90 backdrop-blur-xl text-white/60 border-white/15 hover:border-white/30 hover:text-white"
        )}
      >
        {chatOpen ? <X className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed bottom-22 right-6 z-50 w-[420px] max-h-[600px] flex flex-col rounded-2xl border border-white/10 bg-[#0d0d0d] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center">
                  <Bot className="h-3 w-3 text-white/50" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-white/70 uppercase tracking-widest">Trello Assistant</p>
                  <p className="text-[9px] text-white/25 font-mono">Ask anything · Take actions</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                <span className="text-[9px] font-mono text-white/25">Live</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
              {chatMessages.length === 0 && (
                <div className="space-y-3">
                  <p className="text-[10px] text-white/25 font-mono text-center">Connected to your Trello workspace</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "What are my critical tickets?",
                      "Add a comment to the first card saying 'Under review'",
                      "Show me all open tickets",
                      "Move card [name] to Done",
                    ].map(q => (
                      <button key={q} onClick={() => { setChatInput(q); chatInputRef.current?.focus(); }}
                        className="text-left text-[10px] text-white/40 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/6 hover:bg-white/[0.06] hover:text-white/60 hover:border-white/12 transition-all">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                  <div className={cn(
                    "w-6 h-6 rounded-lg shrink-0 flex items-center justify-center mt-0.5",
                    msg.role === "user" ? "bg-white/10" : "bg-white/5 border border-white/8"
                  )}>
                    {msg.role === "user"
                      ? <User className="h-3 w-3 text-white/50" />
                      : <Bot className="h-3 w-3 text-white/40" />}
                  </div>
                  <div className={cn("max-w-[85%] space-y-2", msg.role === "user" ? "items-end" : "items-start")}>
                    <div className={cn(
                      "px-3.5 py-2.5 rounded-xl text-[12px] leading-relaxed",
                      msg.role === "user"
                        ? "bg-white/10 text-white/80 rounded-tr-sm"
                        : "bg-white/[0.04] border border-white/6 text-white/70 rounded-tl-sm"
                    )}>
                      {msg.content}
                    </div>
                    {msg.actionResults && msg.actionResults.length > 0 && (
                      <div className="space-y-1">
                        {msg.actionResults.map((r, ri) => (
                          <div key={ri} className="flex items-start gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/8">
                            <span className="text-[10px] text-white/50 leading-relaxed font-mono">{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                    <Bot className="h-3 w-3 text-white/40" />
                  </div>
                  <div className="px-3.5 py-2.5 rounded-xl rounded-tl-sm bg-white/[0.04] border border-white/6">
                    <div className="flex items-center gap-1">
                      {[0,1,2].map(i => (
                        <motion.div key={i} className="w-1 h-1 rounded-full bg-white/30"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="shrink-0 border-t border-white/6 px-3 py-3">
              <div className="flex items-end gap-2 bg-white/[0.03] border border-white/8 rounded-xl px-3 py-2.5 focus-within:border-white/20 transition-colors">
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                  placeholder="Ask or command… (Enter to send)"
                  rows={1}
                  className="flex-1 bg-transparent text-[12px] text-white/80 placeholder:text-white/20 resize-none outline-none leading-relaxed max-h-28 overflow-y-auto"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 disabled:opacity-30 hover:opacity-80 transition-opacity"
                >
                  {chatLoading
                    ? <Loader2 className="h-3 w-3 text-background animate-spin" />
                    : <Send className="h-3 w-3 text-background" />}
                </button>
              </div>
              <p className="text-[9px] text-white/15 font-mono mt-1.5 px-1">Shift+Enter for newline · actions post to real Trello</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {ChatPanel}
      {/* Toolbar */}
      <div className="sticky top-0 z-40 flex items-center justify-between h-14 border-b border-white/5 bg-background/90 backdrop-blur-xl px-8">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-black text-white/50 uppercase tracking-widest">Customer Intelligence</span>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/50 animate-pulse" />
            <span className="text-[9px] font-mono text-white/25 uppercase">Trello · Live</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("data")}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest font-bold flex items-center gap-1.5"
          >
            <FileText className="h-3 w-3" /> Raw Data
          </button>
          <Button
            onClick={runAiResolution}
            className="bg-white text-background text-[10px] font-black h-8 px-4 uppercase tracking-widest gap-1.5 hover:opacity-90"
          >
            <Sparkles className="h-3 w-3" />
            AI Resolution
          </Button>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-8 py-8 space-y-8">

        {/* Hero metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Open Tickets",      value: String(openTickets),   sub: "Awaiting resolution" },
            { label: "Critical Issues",   value: String(criticalTickets), sub: "Needs immediate action" },
            { label: "Pipeline Value",    value: `$${(totalPipeline/1000).toFixed(0)}k`, sub: "Across 8 active deals" },
            { label: "NPS Score",         value: intel.avgNps,          sub: "Customer satisfaction" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="p-6 rounded-2xl border border-white/8 bg-white/[0.02] space-y-3"
            >
              <p className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em]">{stat.label}</p>
              <p className="text-3xl font-black text-white">{stat.value}</p>
              <p className="text-[10px] text-white/30">{stat.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Ticket list */}
          <div className="lg:col-span-2 space-y-3">
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Support Tickets</p>
            <div className="space-y-1.5">
              {tickets.map((t, i) => {
                const p = PRIORITY[t.priority as keyof typeof PRIORITY] ?? PRIORITY.low;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:border-white/10 transition-all"
                  >
                    <div className="flex items-center gap-2 w-[88px] shrink-0">
                      <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", p.dot)} />
                      <span className="text-[9px] font-mono text-white/30">{t.id}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white/80 truncate">{t.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-white/30">{t.customer}</span>
                        <span className="text-white/15">·</span>
                        <span className="text-[9px] text-white/25">{t.category}</span>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase px-2 py-0.5 rounded-full",
                      t.status === "open"        ? "bg-white/8  text-white/60" :
                      t.status === "in_progress" ? "bg-white/15 text-white/80" :
                                                   "bg-white/5  text-white/30"
                    )}>{t.status.replace("_"," ")}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Right column: objections + pipeline summary + groq intel if available */}
          <div className="space-y-6">
            {/* Groq patterns if available */}
            {groqIntel?.topPatterns && groqIntel.topPatterns.length > 0 && (
              <div className="p-5 rounded-2xl border border-white/15 bg-white/[0.02] space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3 w-3 text-white/30" />
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">AI Patterns</p>
                </div>
                {groqIntel.topPatterns.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <p className="text-[11px] text-white/60 flex-1 min-w-0 truncate">{p.pattern}</p>
                    <span className="text-[11px] font-black text-white/40 ml-2">{p.count}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Objections */}
            <div className="p-5 rounded-2xl border border-white/8 bg-white/[0.02] space-y-4">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Top Objections</p>
              {intel.objections.map((obj: any) => (
                <div key={obj.name} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/70">{obj.name}</span>
                    <span className="text-[11px] font-black text-white/50 font-mono">{obj.count}%</span>
                  </div>
                  <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${obj.count}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-white/30 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline summary */}
            <div className="p-5 rounded-2xl border border-white/8 bg-white/[0.02] space-y-4">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Sales Pipeline</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <p className="text-[9px] text-white/25 uppercase">Total Value</p>
                  <p className="text-lg font-black text-white">${(totalPipeline/1000).toFixed(0)}k</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] text-white/25 uppercase">Closed Won</p>
                  <p className="text-lg font-black text-white/70">${(closedWon/1000).toFixed(0)}k</p>
                </div>
              </div>
              {deals.slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-white/70 truncate">{d.company}</p>
                    <p className="text-[9px] text-white/25">{d.stage}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-12 h-0.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${d.probability}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-white/40 rounded-full"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-white/40 w-7 text-right">{d.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

