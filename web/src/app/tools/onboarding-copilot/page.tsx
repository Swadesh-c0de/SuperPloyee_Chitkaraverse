"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Zap, Target, Users, BookOpen,
  ArrowRight, ChevronLeft, CheckCircle2,
  Clock, Briefcase, Globe, Database, GitBranch,
  FileText, RotateCcw,
  Cpu, Network, ScanLine, Layers, AlertTriangle,
  User, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useOnboardingStore, useNeuralStore } from "@/lib/store";
import { SOURCE_SEEDS } from "@/lib/neural-seed";
import {
  generateId, saveRoadmap, loadRoadmaps, deleteRoadmap,
  type SavedRoadmap, type RoadmapData,
} from "@/lib/roadmap-store";
import RoadmapView from "./RoadmapView";

// ── Types ──
type Mode = "client" | "employee";

interface Question {
  id: string;
  label: string;
  type: "choice" | "multi";
  options: string[];
}

// ── Questions ──
const CLIENT_QUESTIONS: Question[] = [
  {
    id: "clientType", label: "What type of client is this?", type: "choice",
    options: ["Enterprise (500+ employees)", "Mid-Market (50-500)", "SMB (<50)", "Startup"],
  },
  {
    id: "industry", label: "What industry are they in?", type: "choice",
    options: ["SaaS / Tech", "Financial Services", "Healthcare", "Retail / E-Commerce", "Professional Services", "Manufacturing"],
  },
  {
    id: "goal", label: "Primary onboarding goal?", type: "choice",
    options: ["Product adoption", "API integration", "Data migration", "Team training", "Full digital transformation"],
  },
  {
    id: "techSavviness", label: "Client's technical maturity?", type: "choice",
    options: ["Very high — engineering-driven", "Medium — has a tech team", "Low — operations-led", "None — hand-holding needed"],
  },
  {
    id: "risks", label: "Known friction points?", type: "multi",
    options: ["Budget constraints", "Legacy system dependency", "Low stakeholder buy-in", "Security / compliance blockers", "Team bandwidth", "None identified"],
  },
];

const EMPLOYEE_QUESTIONS: Question[] = [
  {
    id: "role", label: "What is their role?", type: "choice",
    options: ["Engineer / Developer", "Product Manager", "Designer", "Sales / BDR", "Customer Success", "Operations / Admin", "Marketing", "Leadership / Executive"],
  },
  {
    id: "seniority", label: "Seniority level?", type: "choice",
    options: ["Intern / Trainee", "Junior (0–2 yrs)", "Mid-level (2–5 yrs)", "Senior (5–10 yrs)", "Lead / Manager", "Director / VP", "C-Suite"],
  },
  {
    id: "department", label: "Which department?", type: "choice",
    options: ["Engineering", "Product", "Design", "Sales", "Customer Success", "Operations", "Finance", "HR / People", "Marketing"],
  },
  {
    id: "workStyle", label: "Work arrangement?", type: "choice",
    options: ["Fully remote", "Hybrid (2–3 days)", "On-site"],
  },
  {
    id: "priorities", label: "Key onboarding priorities?", type: "multi",
    options: ["Product knowledge", "Technical stack access", "Process & SOPs", "Team relationships", "Customer context", "Strategic vision"],
  },
];

// ── Tool call animation phases ──
const TOOL_PHASES = [
  { id: "scan",    label: "Scanning knowledge base",      icon: ScanLine,  detail: "traversing connected documents..." },
  { id: "index",   label: "Indexing relevant nodes",      icon: Database,  detail: "building context graph..." },
  { id: "link",    label: "Linking dependencies",         icon: Network,   detail: "mapping relationships..." },
  { id: "reason",  label: "Reasoning over context",       icon: Cpu,       detail: "synthesizing with Groq..." },
  { id: "compose", label: "Composing roadmap",            icon: Layers,    detail: "structuring phases..." },
];

// ── Fake retrieval docs for animation ──
const RETRIEVAL_DOCS = [
  { name: "Company Overview Wiki", source: "NOTION", type: "wiki" },
  { name: "Onboarding SOP v3.2", source: "NOTION", type: "sop" },
  { name: "Product Architecture Guide", source: "GITHUB", type: "doc" },
  { name: "Q4 Strategy Document", source: "DRIVE", type: "doc" },
  { name: "Team Structure & Contacts", source: "NOTION", type: "wiki" },
  { name: "Security & Compliance Policy", source: "CONFLUENCE", type: "policy" },
];

const SOURCE_ICONS: Record<string, React.ElementType> = {
  GITHUB: GitBranch, NOTION: Database, SLACK: Zap,
  DRIVE: FileText, INTERCOM: Globe, JIRA: Layers,
  CONFLUENCE: BookOpen, MANUAL: FileText,
};

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "bg-white text-background" },
  high:     { label: "High",     color: "bg-white/15 text-white" },
  medium:   { label: "Medium",   color: "bg-white/8 text-white/60" },
};

// ── Typing dots ──
function TypingDots() {
  return (
    <div className="flex items-center gap-0.5">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1 h-1 rounded-full bg-white/40"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

// ── Main Page ──
export default function OnboardingCopilotPage() {
  const router = useRouter();
  const { company, mission } = useOnboardingStore();
  const { connectedApps, liveNodes } = useNeuralStore();

  // stage: "select" | "wizard" | "generating" | "result"
  const [stage, setStage] = useState<"select" | "wizard" | "generating" | "result">("select");
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [multiSelected, setMultiSelected] = useState<string[]>([]);

  // generation state
  const [genPhaseIdx, setGenPhaseIdx] = useState(0);
  const [visibleDocs, setVisibleDocs] = useState(0);
  const [genProgress, setGenProgress] = useState(0);
  const [savedRoadmap, setSavedRoadmap] = useState<SavedRoadmap | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedRoadmap[]>([]);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadRoadmaps());
  }, []);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  const questions = mode === "client" ? CLIENT_QUESTIONS : EMPLOYEE_QUESTIONS;
  const currentQ = questions[step];
  const isLastStep = step === questions.length - 1;

  const selectOption = (opt: string) => {
    if (currentQ.type === "multi") {
      setMultiSelected(prev =>
        prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt]
      );
    } else {
      setAnswers(prev => ({ ...prev, [currentQ.id]: opt }));
    }
  };

  const nextStep = () => {
    const val = currentQ.type === "multi" ? multiSelected : answers[currentQ.id];
    if (!val || (Array.isArray(val) && val.length === 0)) return;
    const finalAnswers = { ...answers, [currentQ.id]: currentQ.type === "multi" ? multiSelected : answers[currentQ.id] };
    setAnswers(finalAnswers);
    if (isLastStep) {
      startGeneration(finalAnswers);
    } else {
      setStep(s => s + 1);
      setMultiSelected([]);
    }
  };

  const startGeneration = async (finalAnswers: Record<string, string | string[]>) => {
    setStage("generating");
    setGenPhaseIdx(0);
    setVisibleDocs(0);
    setGenProgress(0);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // Animate phases sequentially
    const phaseDurations = [600, 1400, 800, 600, 500];
    let elapsed = 0;
    phaseDurations.forEach((dur, i) => {
      schedule(() => {
        setGenPhaseIdx(i);
        setGenProgress(Math.round(((i + 1) / TOOL_PHASES.length) * 80));
      }, elapsed);
      elapsed += dur;
    });

    // Stagger doc cards
    RETRIEVAL_DOCS.forEach((_, i) => {
      schedule(() => setVisibleDocs(i + 1), 800 + i * 280);
    });

    // Fire Groq call
    const companyContext = [
      `Company: ${company.name || "Unknown"}`,
      `Industry: ${company.industry || "Unknown"}`,
      `Mission: ${mission.oneLiner || "Not set"}`,
      `Problem: ${mission.biggestProblem || "Not set"}`,
      `Connected sources: ${connectedApps.join(", ") || "None"}`,
      `Live knowledge nodes: ${liveNodes.length}`,
    ].join("\n");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, answers: finalAnswers, companyContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.raw ?? data.error);

      schedule(() => {
        setGenProgress(100);
        setTimeout(() => {
          const entry: SavedRoadmap = {
            id: generateId(),
            mode: mode!,
            createdAt: new Date().toISOString(),
            roadmap: data as RoadmapData,
          };
          saveRoadmap(entry);
          setSavedRoadmap(entry);
          setHistory(loadRoadmaps());
          setStage("result");
        }, 400);
      }, elapsed + 200);
    } catch (e: any) {
      setGenError(e.message ?? "Unknown error");
      setStage("generating"); // keep on screen with error
    }
  };

  const handleReset = () => {
    timersRef.current.forEach(clearTimeout);
    setStage("select");
    setMode(null);
    setStep(0);
    setAnswers({});
    setMultiSelected([]);
    setSavedRoadmap(null);
    setGenError(null);
    setGenPhaseIdx(0);
    setVisibleDocs(0);
    setGenProgress(0);
    setHistory(loadRoadmaps());
  };

  // ── STAGE: Select Mode ──
  if (stage === "select") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6">
        <style>{`@media print { .no-print { display: none !important; } body { background: white; color: black; } }`}</style>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-12 no-print"
        >
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-black text-white/40 uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              Cortex Onboarding Engine
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">Who are you onboarding?</h1>
            <p className="text-sm text-white/40 max-w-md mx-auto leading-relaxed">
              Select the onboarding type. Cortex will retrieve from your knowledge base and generate a tailored roadmap using AI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {([
              {
                id: "client" as Mode,
                icon: Building2,
                label: "Client Onboarding",
                desc: "Generate an activation roadmap for a new customer. Covers product adoption, integration, and value realization.",
                badge: "B2B / Enterprise",
              },
              {
                id: "employee" as Mode,
                icon: User,
                label: "Employee Onboarding",
                desc: "Build a 30-60-90 day plan for a new hire. Tailored by role, seniority, and department.",
                badge: "New Hire",
              },
            ] as const).map(opt => (
              <motion.button
                key={opt.id}
                whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.2)" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setMode(opt.id); setStage("wizard"); }}
                className="relative flex flex-col gap-6 p-8 rounded-[2rem] bg-white/[0.03] border border-white/8 text-left group overflow-hidden hover:bg-white/[0.06] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center group-hover:bg-white/15 transition-all">
                    <opt.icon className="h-5 w-5 text-white/60 group-hover:text-white transition-colors" />
                  </div>
                  <Badge variant="outline" className="text-[9px] opacity-40 uppercase">{opt.badge}</Badge>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">{opt.label}</h3>
                  <p className="text-[11px] text-white/40 leading-relaxed">{opt.desc}</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/30 group-hover:text-white/60 font-bold uppercase tracking-widest transition-colors">
                  Configure <ArrowRight className="h-3 w-3" />
                </div>
                <Sparkles className="absolute -right-6 -bottom-6 h-24 w-24 text-white opacity-[0.02] group-hover:opacity-[0.04] transition-opacity" />
              </motion.button>
            ))}
          </div>

          {/* Past generations */}
          {history.length > 0 && (
            <div className="space-y-3 pt-4">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Past Roadmaps</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {history.map(h => (
                  <div
                    key={h.id}
                    className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/6 hover:bg-white/[0.05] hover:border-white/15 transition-all cursor-pointer"
                    onClick={() => router.push(`/tools/onboarding-copilot/${h.id}`)}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                      {h.mode === "client" ? <Building2 className="h-3.5 w-3.5 text-white/40" /> : <User className="h-3.5 w-3.5 text-white/40" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-white/70 truncate">{h.roadmap.title}</p>
                      <p className="text-[9px] text-white/25 font-mono uppercase">{new Date(h.createdAt).toLocaleDateString()} · {h.id}</p>
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

  // ── STAGE: Wizard MCQ ──
  if (stage === "wizard") {
    const progress = ((step) / questions.length) * 100;
    const currentAnswer = answers[currentQ.id];
    const canProceed = currentQ.type === "multi"
      ? multiSelected.length > 0
      : !!currentAnswer;

    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6 no-print">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          className="w-full max-w-xl space-y-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => step === 0 ? (setStage("select"), setMode(null)) : (setStep(s => s - 1), setMultiSelected([]))}
              className="flex items-center gap-2 text-[11px] text-white/30 hover:text-white/60 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </button>
            <span className="text-[10px] font-mono text-white/20 uppercase">
              {mode === "client" ? "Client" : "Employee"} · {step + 1} / {questions.length}
            </span>
          </div>

          {/* Progress */}
          <div className="h-[2px] bg-white/5 rounded-full overflow-hidden">
            <motion.div className="h-full bg-white/50 rounded-full" animate={{ width: `${progress}%` }} />
          </div>

          {/* Question */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white leading-tight">{currentQ.label}</h2>
            {currentQ.type === "multi" && (
              <p className="text-[11px] text-white/30 font-mono">Select all that apply</p>
            )}
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options.map(opt => {
                const isSelected = currentQ.type === "multi"
                  ? multiSelected.includes(opt)
                  : currentAnswer === opt;
                return (
                  <motion.button
                    key={opt}
                    whileHover={{ x: 4 }}
                    onClick={() => selectOption(opt)}
                    className={`flex items-center justify-between px-5 py-4 rounded-xl border text-left transition-all text-sm font-medium ${
                      isSelected
                        ? "bg-white text-background border-white"
                        : "bg-white/[0.03] border-white/8 text-white/60 hover:border-white/20 hover:text-white hover:bg-white/[0.06]"
                    }`}
                  >
                    {opt}
                    {isSelected && <CheckCircle2 className="h-4 w-4 shrink-0" />}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={nextStep}
            disabled={!canProceed}
            className="w-full h-12 bg-white text-background font-black uppercase tracking-widest text-[11px] hover:opacity-90 disabled:opacity-20 rounded-xl"
          >
            {isLastStep ? "Generate Roadmap" : "Continue"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>
      </div>
    );
  }

  // ── STAGE: Generating ──
  if (stage === "generating") {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6 no-print">
        <div className="w-full max-w-lg space-y-10">
          {/* Header */}
          <div className="text-center space-y-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="inline-flex"
            >
              <Sparkles className="h-10 w-10 text-white/60" />
            </motion.div>
            <h2 className="text-xl font-bold text-white">Cortex is building your roadmap</h2>
            <p className="text-[11px] text-white/30 font-mono">Retrieving from knowledge base · Synthesizing with Groq</p>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white/60 rounded-full"
              animate={{ width: `${genProgress}%` }}
              transition={{ ease: "easeOut", duration: 0.5 }}
            />
          </div>

          {/* Phase steps */}
          <div className="space-y-3">
            {TOOL_PHASES.map((phase, i) => {
              const Icon = phase.icon;
              const isDone = i < genPhaseIdx;
              const isActive = i === genPhaseIdx;
              return (
                <motion.div
                  key={phase.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: isDone ? 0.35 : isActive ? 1 : 0.2, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-4"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isDone ? "border-white/10 bg-white/5" :
                    isActive ? "border-white/20 bg-white/10" :
                    "border-white/5 bg-transparent"
                  }`}>
                    {isDone ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-white/40" />
                    ) : isActive ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Icon className="h-3.5 w-3.5 text-white/80" />
                      </motion.div>
                    ) : (
                      <Icon className="h-3.5 w-3.5 text-white/20" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-semibold text-white/80">{phase.label}</p>
                    {isActive && <p className="text-[10px] text-white/30 font-mono">{phase.detail}</p>}
                  </div>
                  {isActive && <TypingDots />}
                </motion.div>
              );
            })}
          </div>

          {/* Doc cards */}
          {visibleDocs > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                Pulling {visibleDocs} of {RETRIEVAL_DOCS.length} documents
              </p>
              <AnimatePresence>
                {RETRIEVAL_DOCS.slice(0, visibleDocs).map(doc => {
                  const Icon = SOURCE_ICONS[doc.source] ?? FileText;
                  return (
                    <motion.div
                      key={doc.name}
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/8"
                    >
                      <div className="w-6 h-6 rounded-md bg-white/8 flex items-center justify-center shrink-0">
                        <Icon className="h-3 w-3 text-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-white/70 font-medium truncate">{doc.name}</p>
                        <p className="text-[9px] text-white/25 font-mono">{doc.source} · {doc.type}</p>
                      </div>
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-white/60"
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}

          {genError && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/20">
              <AlertTriangle className="h-4 w-4 text-white/60 shrink-0" />
              <div className="flex-1">
                <p className="text-[11px] text-white/70 font-medium">Generation failed</p>
                <p className="text-[9px] text-white/30 font-mono truncate">{genError}</p>
              </div>
              <Button variant="outline" onClick={handleReset} className="text-[10px] h-7 px-3 font-black uppercase rounded-lg">Retry</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── STAGE: Result / Roadmap ──
  if (stage === "result" && savedRoadmap) {
    return <RoadmapView saved={savedRoadmap} onReset={handleReset} />;
  }

  return null;
}
