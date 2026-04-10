"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ArrowRight, ChevronLeft, CheckCircle2, RotateCcw,
  Zap, Database, Network, Cpu, ScanLine, Layers,
  GitBranch, FileText, BookOpen, Brain,
  User, Code2, GitMerge, Globe,
  AlertTriangle, Shield, Star, Play,
  Plus, Minus, ChevronDown, ChevronRight,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOnboardingStore, useNeuralStore } from "@/lib/store";
import { generateId, saveSOP, loadSOPs, type SavedSOP } from "@/lib/roadmap-store";

// ── Types ──────────────────────────────────────────────────────────────────
interface SOPVariable { name: string; description: string; example: string; }
interface SOPBranch   { condition: string; nextStep: string; }
interface SOPStep {
  id: string; order: number; title: string; instruction: string;
  type: "manual" | "ai" | "decision" | "api";
  source: string;
  branches: SOPBranch[] | null;
  aiPrompt: string | null;
}
interface SOPRule    { condition: string; action: string; }
interface SOPOutput  { type: string; description: string; format: string; }
interface SOPDoc {
  title: string; category: string; description: string;
  trigger: string; goal: string; conditions: string;
  variables: SOPVariable[];
  steps: SOPStep[];
  rules: SOPRule[];
  outputs: SOPOutput[];
  aiTone: string; aiConstraints: string[];
  owner: string; reviewFrequency: string; tags: string[];
}

// ── Static data ─────────────────────────────────────────────────────────────
const TOOL_PHASES = [
  { id: "scan",    label: "Scanning knowledge base",    icon: ScanLine,  detail: "traversing wiki vault & SOPs…" },
  { id: "index",   label: "Indexing relevant nodes",    icon: Database,  detail: "building context graph…" },
  { id: "link",    label: "Linking dependencies",       icon: Network,   detail: "mapping doc relationships…" },
  { id: "reason",  label: "Reasoning over context",     icon: Cpu,       detail: "synthesizing with Groq…" },
  { id: "compose", label: "Composing procedure",        icon: Layers,    detail: "structuring steps & rules…" },
];

const RETRIEVAL_DOCS = [
  { name: "Company SOP Library v2.1",    source: "NOTION",     type: "sop" },
  { name: "Process Design Framework",    source: "CONFLUENCE", type: "doc" },
  { name: "Compliance Policy Manual",    source: "DRIVE",      type: "policy" },
  { name: "Decision Log Q4",             source: "NOTION",     type: "wiki" },
  { name: "Automation Runbook",          source: "GITHUB",     type: "doc" },
  { name: "Team Contacts & Escalations", source: "NOTION",     type: "wiki" },
];

const SOURCE_ICONS: Record<string, React.ElementType> = {
  GITHUB: GitBranch, NOTION: Database, DRIVE: FileText,
  CONFLUENCE: BookOpen, MANUAL: FileText,
};

const STEP_TYPE_CONFIG = {
  manual:   { label: "Manual",   icon: User,     color: "bg-white/8 text-white/60",   border: "border-white/10" },
  ai:       { label: "AI Action",icon: Brain,    color: "bg-white/15 text-white",      border: "border-white/20" },
  decision: { label: "Decision", icon: GitMerge, color: "bg-white/5 text-white/40",   border: "border-white/8" },
  api:      { label: "API Call", icon: Code2,    color: "bg-white/8 text-white/50",   border: "border-white/12" },
};

const CONTEXT_STEPS = [
  {
    id: "trigger",
    label: "When does this SOP start?",
    sub: "Describe the triggering event or condition",
    placeholder: "e.g. When a customer submits a refund request",
    field: "trigger" as const,
  },
  {
    id: "goal",
    label: "What are we trying to achieve?",
    sub: "Define the desired outcome",
    placeholder: "e.g. Resolve refund within 24 hours with full audit trail",
    field: "goal" as const,
  },
  {
    id: "conditions",
    label: "When should this NOT apply?",
    sub: "Define constraints and exclusions",
    placeholder: "e.g. Only for orders within 30 days, exclude subscriptions",
    field: "conditions" as const,
  },
];

// ── Typing dots ──────────────────────────────────────────────────────────────
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

// ── Typewriter ───────────────────────────────────────────────────────────────
function Typewriter({ text, speed = 28, onDone }: { text: string; speed?: number; onDone?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const t = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) { clearInterval(t); onDone?.(); }
    }, speed);
    return () => clearInterval(t);
  }, [text, speed, onDone]);
  return <span>{displayed}<span className="opacity-60 animate-pulse">|</span></span>;
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function SOPAutopilotPage() {
  const { company, mission } = useOnboardingStore();
  const { connectedApps, liveNodes } = useNeuralStore();

  // stage: "intent" | "context" | "config" | "generating" | "result"
  const [stage, setStage] = useState<"intent"|"context"|"config"|"generating"|"result">("intent");
  const [intent, setIntent] = useState("");
  const [intentDone, setIntentDone] = useState(false);
  const [contextStep, setContextStep] = useState(0);
  const [contextData, setContextData] = useState({ trigger: "", goal: "", conditions: "" });
  const [configData, setConfigData] = useState({
    category: "Support", department: "Customer Success",
    enforcement: "Strict", tone: "Professional",
  });
  const [genPhaseIdx, setGenPhaseIdx]   = useState(0);
  const [visibleDocs, setVisibleDocs]   = useState(0);
  const [genProgress, setGenProgress]   = useState(0);
  const [sop, setSop]                   = useState<SOPDoc | null>(null);
  const [currentId, setCurrentId]       = useState<string | null>(null);
  const [genError, setGenError]         = useState<string | null>(null);
  const [activeTab, setActiveTab]       = useState<"steps"|"rules"|"vars"|"outputs">("steps");
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [simulating, setSimulating]     = useState(false);
  const [simStep, setSimStep]           = useState(0);
  const [history, setHistory]           = useState<SavedSOP[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    setHistory(loadSOPs());
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
    return t;
  }, []);

  const handleReset = () => {
    timersRef.current.forEach(clearTimeout);
    setStage("intent"); setIntent(""); setIntentDone(false);
    setContextStep(0); setContextData({ trigger: "", goal: "", conditions: "" });
    setSop(null); setCurrentId(null); setGenError(null); setGenPhaseIdx(0);
    setVisibleDocs(0); setGenProgress(0); setSimulating(false); setSimStep(0);
    setHistory(loadSOPs());
  };

  const loadFromHistory = (entry: SavedSOP) => {
    setSop(entry.sop as unknown as SOPDoc);
    setCurrentId(entry.id);
    setStage("result");
    setActiveTab("steps");
    setExpandedStep(null);
    setSimulating(false);
    setSimStep(0);
  };

  const startGeneration = async () => {
    setStage("generating");
    setGenPhaseIdx(0); setVisibleDocs(0); setGenProgress(0);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    const phaseDurs = [700, 1200, 900, 700, 600];
    let elapsed = 0;
    phaseDurs.forEach((dur, i) => {
      schedule(() => {
        setGenPhaseIdx(i);
        setGenProgress(Math.round(((i + 1) / TOOL_PHASES.length) * 75));
      }, elapsed);
      elapsed += dur;
    });
    RETRIEVAL_DOCS.forEach((_, i) => {
      schedule(() => setVisibleDocs(i + 1), 900 + i * 300);
    });

    const companyContext = [
      `Company: ${company.name || "Unknown"}`,
      `Industry: ${company.industry || "Unknown"}`,
      `Mission: ${mission.oneLiner || "Not set"}`,
      `Connected sources: ${connectedApps.join(", ") || "None"}`,
      `Live knowledge nodes: ${liveNodes.length}`,
    ].join("\n");

    try {
      const res = await fetch("/api/sop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent, context: { ...contextData, ...configData }, companyContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.raw ?? data.error);
      schedule(() => {
        setGenProgress(100);
        setTimeout(() => {
          const newId = generateId();
          const entry: SavedSOP = {
            id: newId,
            intent,
            category: (data as SOPDoc).category ?? configData.category,
            createdAt: new Date().toISOString(),
            sop: data as Record<string, unknown>,
          };
          saveSOP(entry);
          setCurrentId(newId);
          setHistory(loadSOPs());
          setSop(data as SOPDoc);
          setStage("result");
        }, 400);
      }, elapsed + 300);
    } catch (e: any) {
      setGenError(e.message ?? "Unknown error");
    }
  };

  // ── STAGE: Intent ──────────────────────────────────────────────────────────
  if (stage === "intent") {
    const EXAMPLES = [
      "Handle refund requests from customers",
      "Escalate critical security incidents",
      "Onboard a new enterprise client",
      "Run quarterly performance reviews",
    ];
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-10"
        >
          <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              Cortex SOP Autopilot
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">What do you want to automate?</h1>
            <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
              Describe a business process in plain language. Cortex will retrieve from your knowledge base and compile a machine-readable SOP.
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <textarea
                autoFocus
                value={intent}
                onChange={e => setIntent(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && intent.trim().length > 6) {
                    e.preventDefault();
                    setIntentDone(true);
                    setTimeout(() => setStage("context"), 600);
                  }
                }}
                placeholder="e.g. Handle customer refund requests…"
                rows={3}
                className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-6 py-5 text-base text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 focus:bg-white/[0.05] transition-all resize-none"
              />
              <div className="absolute bottom-4 right-4 text-[10px] text-white/20 font-mono">
                {intent.length > 6 ? "↵ Enter to continue" : ""}
              </div>
            </div>
            <Button
              onClick={() => { setIntentDone(true); setTimeout(() => setStage("context"), 300); }}
              disabled={intent.trim().length < 7}
              className="w-full h-12 bg-white text-background text-[11px] font-black uppercase tracking-widest hover:opacity-90 gap-2"
            >
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Quick examples</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => setIntent(ex)}
                  className="text-[11px] text-white/40 border border-white/8 rounded-full px-3 py-1 hover:border-white/20 hover:text-white/70 transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3 pt-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Previous SOPs</p>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {history.map(h => (
                  <div
                    key={h.id}
                    onClick={() => loadFromHistory(h)}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/6 hover:bg-white/[0.05] hover:border-white/15 transition-all cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                      <FileText className="h-3.5 w-3.5 text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white/70 truncate">{h.intent}</p>
                      <p className="text-[9px] text-white/25 font-mono uppercase">
                        {h.category} · {new Date(h.createdAt).toLocaleDateString()} · {h.id}
                      </p>
                    </div>
                    <ArrowRight className="h-3 w-3 text-white/20 group-hover:text-white/50 shrink-0 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  // ── STAGE: Context Builder ─────────────────────────────────────────────────
  if (stage === "context") {
    const currentField = CONTEXT_STEPS[contextStep];
    const fieldVal = contextData[currentField.field];
    const isLast = contextStep === CONTEXT_STEPS.length - 1;
    const progress = ((contextStep) / (CONTEXT_STEPS.length)) * 100;

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div
          key={contextStep}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="w-full max-w-xl space-y-10"
        >
          {/* Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => contextStep === 0 ? setStage("intent") : setContextStep(s => s - 1)}
                className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back
              </button>
              <span className="text-[10px] font-mono text-white/20">{contextStep + 1} / {CONTEXT_STEPS.length}</span>
            </div>
            <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>

          {/* Intent echo */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/6">
            <Sparkles className="h-3 w-3 text-white/20 shrink-0" />
            <span className="text-[11px] text-white/40 italic truncate">&ldquo;{intent}&rdquo;</span>
          </div>

          {/* Question */}
          <div className="space-y-2">
            <p className="text-[10px] font-black text-white/25 uppercase tracking-[0.25em]">{currentField.sub}</p>
            <h2 className="text-2xl font-black text-white leading-tight">{currentField.label}</h2>
          </div>

          <div className="space-y-4">
            <textarea
              autoFocus
              value={fieldVal}
              onChange={e => setContextData(prev => ({ ...prev, [currentField.field]: e.target.value }))}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && fieldVal.trim().length > 3) {
                  e.preventDefault();
                  if (isLast) setStage("config");
                  else setContextStep(s => s + 1);
                }
              }}
              placeholder={currentField.placeholder}
              rows={3}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/25 transition-all resize-none"
            />
            <Button
              onClick={() => {
                if (isLast) setStage("config");
                else setContextStep(s => s + 1);
              }}
              disabled={fieldVal.trim().length < 4}
              className="w-full h-11 bg-white text-background text-[11px] font-black uppercase tracking-widest hover:opacity-90 gap-2"
            >
              {isLast ? "Configure SOP" : "Next"} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── STAGE: Config ──────────────────────────────────────────────────────────
  if (stage === "config") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-10"
        >
          <div className="space-y-2">
            <button
              onClick={() => setStage("context")}
              className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white/60 transition-colors mb-4"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Back
            </button>
            <h2 className="text-2xl font-black text-white">Configure parameters</h2>
            <p className="text-sm text-white/40">Set enforcement level, AI tone, and department. Cortex will tailor the output.</p>
          </div>

          <div className="space-y-8">
            {/* Category */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Category</p>
              <div className="flex flex-wrap gap-2">
                {["Support","Sales","Operations","Engineering","HR","Finance","Compliance"].map(c => (
                  <button
                    key={c}
                    onClick={() => setConfigData(p => ({ ...p, category: c }))}
                    className={cn(
                      "px-4 py-2 rounded-xl border text-[11px] font-bold transition-all",
                      configData.category === c
                        ? "bg-white text-background border-white"
                        : "bg-white/[0.03] border-white/8 text-white/50 hover:border-white/20 hover:text-white/80"
                    )}
                  >{c}</button>
                ))}
              </div>
            </div>

            {/* Enforcement */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">Enforcement Level</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: "Strict",      sub: "Hard requirement" },
                  { v: "Recommended", sub: "Best practice" },
                  { v: "Suggested",   sub: "Optional flow" },
                ].map(({ v, sub }) => (
                  <button
                    key={v}
                    onClick={() => setConfigData(p => ({ ...p, enforcement: v }))}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      configData.enforcement === v
                        ? "bg-white/8 border-white/25"
                        : "bg-white/[0.02] border-white/6 hover:border-white/15"
                    )}
                  >
                    <p className="text-[11px] font-black text-white">{v}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Tone */}
            <div className="space-y-3">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em]">AI Tone</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: "Professional", sub: "Formal & precise" },
                  { v: "Friendly",     sub: "Warm & clear" },
                  { v: "Strict",       sub: "Direct & firm" },
                ].map(({ v, sub }) => (
                  <button
                    key={v}
                    onClick={() => setConfigData(p => ({ ...p, tone: v }))}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      configData.tone === v
                        ? "bg-white/8 border-white/25"
                        : "bg-white/[0.02] border-white/6 hover:border-white/15"
                    )}
                  >
                    <p className="text-[11px] font-black text-white">{v}</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{sub}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button
            onClick={startGeneration}
            className="w-full h-14 bg-white text-background text-[11px] font-black uppercase tracking-widest hover:opacity-90 gap-2 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Compile SOP with Cortex
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── STAGE: Generating ──────────────────────────────────────────────────────
  if (stage === "generating") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-2xl space-y-12">
          {genError ? (
            <div className="text-center space-y-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-white/40" />
              </div>
              <p className="text-sm text-white/50">Generation failed: {genError}</p>
              <Button variant="outline" onClick={handleReset} className="text-[10px] h-9 px-5 font-black uppercase">
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Tool phases */}
              <div className="space-y-3">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Cortex is working</p>
                {TOOL_PHASES.map((phase, i) => {
                  const Icon = phase.icon;
                  const done = i < genPhaseIdx;
                  const active = i === genPhaseIdx;
                  return (
                    <motion.div
                      key={phase.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: active || done ? 1 : 0.25, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <div className={cn(
                        "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-all",
                        done   ? "bg-white border-white"      :
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

              {/* Retrieved docs */}
              <div className="space-y-2">
                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Retrieving from knowledge base</p>
                <div className="grid grid-cols-2 gap-2">
                  {RETRIEVAL_DOCS.slice(0, visibleDocs).map((doc, i) => {
                    const Icon = SOURCE_ICONS[doc.source] ?? FileText;
                    return (
                      <motion.div
                        key={doc.name}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/8"
                      >
                        <Icon className="h-3 w-3 text-white/30 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white/60 truncate">{doc.name}</p>
                          <p className="text-[9px] text-white/20 font-mono">{doc.source}</p>
                        </div>
                        <motion.div
                          className="w-1.5 h-1.5 rounded-full bg-white/40"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-mono text-white/20">
                  <span>Compiling procedure…</span>
                  <span>{genProgress}%</span>
                </div>
                <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white rounded-full"
                    animate={{ width: `${genProgress}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── STAGE: Result / SOP Viewer ─────────────────────────────────────────────
  if (stage === "result" && sop) {
    const TABS = [
      { id: "steps",   label: `Steps (${sop.steps?.length ?? 0})` },
      { id: "rules",   label: `IF-THEN Rules (${sop.rules?.length ?? 0})` },
      { id: "vars",    label: `Variables (${sop.variables?.length ?? 0})` },
      { id: "outputs", label: `Outputs (${sop.outputs?.length ?? 0})` },
    ] as const;

    const runSimulate = () => {
      setSimulating(true);
      setSimStep(0);
      const steps = sop.steps ?? [];
      steps.forEach((_, i) => {
        schedule(() => setSimStep(i + 1), 800 + i * 900);
      });
      schedule(() => setSimulating(false), 800 + steps.length * 900 + 600);
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Toolbar */}
        <div className="sticky top-0 z-40 flex items-center justify-between h-14 border-b border-white/5 bg-background/90 backdrop-blur-xl px-8">
          <div className="flex items-center gap-4">
            <button onClick={handleReset} className="flex items-center gap-2 text-[11px] text-white/30 hover:text-white/60 transition-colors">
              <RotateCcw className="h-3.5 w-3.5" /> New SOP
            </button>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] font-black uppercase">{sop.category}</Badge>
              <span className="text-[9px] font-mono text-white/20 uppercase">{sop.reviewFrequency} review · {sop.owner}</span>
              {currentId && <span className="text-[9px] font-mono text-white/15">· {currentId}</span>}
            </div>
          </div>
          <Button
            onClick={runSimulate}
            disabled={simulating}
            className="bg-white text-background text-[10px] font-black h-8 px-4 uppercase tracking-widest gap-1.5 hover:opacity-90"
          >
            <Play className="h-3 w-3" />
            {simulating ? "Simulating…" : "Simulate Run"}
          </Button>
        </div>

        <div className="max-w-5xl mx-auto px-8 py-10 space-y-10">
          {/* Header */}
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-3">
                <h1 className="text-3xl font-black text-white leading-tight">{sop.title}</h1>
                <p className="text-sm text-white/50 leading-relaxed max-w-2xl">{sop.description}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 shrink-0">
                {(sop.tags ?? []).map(tag => (
                  <span key={tag} className="text-[9px] font-bold text-white/30 border border-white/10 px-2 py-0.5 rounded-full uppercase">{tag}</span>
                ))}
              </div>
            </div>

            {/* Trigger / Goal / Conditions row */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Trigger",     value: sop.trigger,    icon: Zap },
                { label: "Goal",        value: sop.goal,       icon: Star },
                { label: "Constraints", value: sop.conditions, icon: Shield },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[9px] font-black text-white/25 uppercase tracking-[0.2em]">
                    <Icon className="h-2.5 w-2.5" /> {label}
                  </div>
                  <p className="text-[12px] text-white/70 leading-relaxed">{value}</p>
                </div>
              ))}
            </div>

            {/* AI settings */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/6">
              <Brain className="h-3.5 w-3.5 text-white/30" />
              <span className="text-[10px] text-white/40 font-mono">AI Tone: <span className="text-white/60 font-bold">{sop.aiTone}</span></span>
              <div className="h-3 w-px bg-white/10" />
              {(sop.aiConstraints ?? []).map((c, i) => (
                <span key={i} className="text-[9px] text-white/30 border border-white/8 rounded px-1.5 py-0.5">{c}</span>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/6">
            <div className="flex gap-0">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-5 py-2.5 text-[11px] font-black uppercase tracking-widest border-b-2 transition-all",
                    activeTab === tab.id
                      ? "border-white text-white"
                      : "border-transparent text-white/25 hover:text-white/50"
                  )}
                >{tab.label}</button>
              ))}
            </div>
          </div>

          {/* Steps tab */}
          <AnimatePresence mode="wait">
            {activeTab === "steps" && (
              <motion.div key="steps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {(sop.steps ?? []).map((step, i) => {
                  const cfg = STEP_TYPE_CONFIG[step.type] ?? STEP_TYPE_CONFIG.manual;
                  const Icon = cfg.icon;
                  const isExpanded = expandedStep === step.id;
                  const simDone = simulating && simStep > i;
                  const simActive = simulating && simStep === i;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className={cn(
                        "rounded-2xl border transition-all overflow-hidden",
                        simDone   ? "border-white/20 bg-white/[0.04]" :
                        simActive ? "border-white/30 bg-white/[0.06] shadow-[0_0_20px_rgba(255,255,255,0.05)]" :
                                    `${cfg.border} bg-white/[0.02] hover:bg-white/[0.03]`
                      )}
                    >
                      <button
                        className="w-full flex items-center gap-4 px-6 py-4 text-left"
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-all",
                          simDone ? "bg-white border-white" : `${cfg.color} border-current`
                        )}>
                          {simDone
                            ? <CheckCircle2 className="h-4 w-4 text-background" />
                            : <Icon className="h-3.5 w-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-black text-white/20 font-mono">
                              {String(step.order).padStart(2,"0")}
                            </span>
                            <h4 className="text-[13px] font-bold text-white">{step.title}</h4>
                            <span className={cn("text-[9px] font-black px-2 py-0.5 rounded uppercase", cfg.color)}>
                              {cfg.label}
                            </span>
                            {simActive && (
                              <span className="text-[9px] font-black text-white/60 uppercase animate-pulse">● Running</span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/40 mt-0.5 truncate">{step.instruction}</p>
                        </div>
                        <ChevronDown className={cn("h-3.5 w-3.5 text-white/20 transition-transform shrink-0", isExpanded && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: "auto" }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-5 space-y-4 border-t border-white/5 pt-4">
                              <p className="text-[12px] text-white/60 leading-relaxed">{step.instruction}</p>

                              {step.type === "ai" && step.aiPrompt && (
                                <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 space-y-1">
                                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">AI Prompt Template</p>
                                  <p className="text-[11px] text-white/60 font-mono leading-relaxed">{step.aiPrompt}</p>
                                </div>
                              )}

                              {step.type === "decision" && step.branches && step.branches.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Decision Branches</p>
                                  {step.branches.map((b, bi) => (
                                    <div key={bi} className="flex items-center gap-2 text-[11px]">
                                      <span className="px-2 py-0.5 rounded bg-white/8 text-white/60 font-mono">{b.condition}</span>
                                      <ArrowRight className="h-3 w-3 text-white/20" />
                                      <span className="text-white/40">{b.nextStep}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-1.5 text-[9px] text-white/20 font-mono">
                                <BookOpen className="h-2.5 w-2.5" /> Source: {step.source}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Rules tab */}
            {activeTab === "rules" && (
              <motion.div key="rules" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-[11px] text-white/30 leading-relaxed">
                  Conditional logic that makes this SOP intelligent. Applied at runtime.
                </p>
                {(sop.rules ?? []).map((rule, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-0 rounded-2xl overflow-hidden border border-white/8"
                  >
                    <div className="px-5 py-4 bg-white/[0.04] border-r border-white/8 min-w-[140px]">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">IF</p>
                      <p className="text-[12px] font-bold text-white/80">{rule.condition}</p>
                    </div>
                    <div className="flex items-center px-4">
                      <ArrowRight className="h-4 w-4 text-white/15" />
                    </div>
                    <div className="px-5 py-4 flex-1">
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">THEN</p>
                      <p className="text-[12px] font-bold text-white/70">{rule.action}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Variables tab */}
            {activeTab === "vars" && (
              <motion.div key="vars" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                <p className="text-[11px] text-white/30 leading-relaxed">
                  Dynamic variables injected at runtime. Use <code className="font-mono bg-white/5 px-1 rounded text-white/50">{"{{variable_name}}"}</code> in prompts and instructions.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(sop.variables ?? []).map((v, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <code className="text-[11px] font-black text-white font-mono bg-white/8 px-2 py-0.5 rounded">
                          {"{{"}{v.name}{"}}"}
                        </code>
                      </div>
                      <p className="text-[11px] text-white/50">{v.description}</p>
                      <p className="text-[10px] text-white/25 font-mono">e.g. {v.example}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Outputs tab */}
            {activeTab === "outputs" && (
              <motion.div key="outputs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {(sop.outputs ?? []).map((out, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="flex items-start gap-5 p-5 rounded-2xl bg-white/[0.02] border border-white/8"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4 text-white/40" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-bold text-white">{out.type}</p>
                        <span className="text-[9px] text-white/30 font-mono border border-white/10 px-1.5 py-0.5 rounded uppercase">{out.format}</span>
                      </div>
                      <p className="text-[12px] text-white/50 leading-relaxed">{out.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return null;
}
