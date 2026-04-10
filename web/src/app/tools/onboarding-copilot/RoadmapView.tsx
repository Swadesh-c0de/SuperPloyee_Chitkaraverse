"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, ArrowRight, Download, Share2, RotateCcw,
  AlertTriangle, Star, TrendingUp, Shield, Globe, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RoadmapData, SavedRoadmap } from "@/lib/roadmap-store";

const PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "bg-white text-background" },
  high:     { label: "High",     color: "bg-white/15 text-white" },
  medium:   { label: "Medium",   color: "bg-white/8 text-white/60" },
};

interface Props {
  saved: SavedRoadmap;
  onReset?: () => void;
}

export default function RoadmapView({ saved, onReset }: Props) {
  const { roadmap, mode, id, createdAt } = saved;
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const phaseColors = ["border-white/20", "border-white/12", "border-white/8"];

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/tools/onboarding-copilot/${id}`
      : `/tools/onboarding-copilot/${id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body, html { background: #000 !important; color: #fff !important; }
          .print-page { background: #000 !important; }
          h1, h2, h3, h4 { color: #fff !important; }
          p, li, span { color: rgba(255,255,255,0.75) !important; }
          .print-phase { border: 1px solid rgba(255,255,255,0.2) !important; background: rgba(255,255,255,0.03) !important; }
          .print-milestone { border-bottom: 1px solid rgba(255,255,255,0.06) !important; }
          .print-badge-critical { background: #fff !important; color: #000 !important; }
          .print-badge-high { background: rgba(255,255,255,0.15) !important; color: #fff !important; }
          .print-badge-medium { background: rgba(255,255,255,0.08) !important; color: rgba(255,255,255,0.6) !important; }
          .print-section { background: rgba(255,255,255,0.02) !important; border: 1px solid rgba(255,255,255,0.08) !important; }
          .print-break { page-break-before: always; }
          .print-header-badge { background: #fff !important; color: #000 !important; }
          .print-divider { border-color: rgba(255,255,255,0.05) !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="no-print sticky top-0 z-40 flex items-center justify-between h-14 border-b border-white/5 bg-background/90 backdrop-blur-xl px-8">
        <div className="flex items-center gap-4">
          {onReset && (
            <>
              <button
                onClick={onReset}
                className="flex items-center gap-2 text-[11px] text-white/30 hover:text-white/60 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                New Roadmap
              </button>
              <div className="h-4 w-px bg-white/10" />
            </>
          )}
          <span className="text-[10px] font-mono text-white/20 uppercase">
            {mode === "client" ? "Client" : "Employee"} Onboarding · Cortex ·{" "}
            <span className="font-black tracking-widest">{id}</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="instrument-border text-[10px] font-black h-8 px-4 uppercase tracking-widest gap-1.5"
          >
            <Download className="h-3 w-3" />
            Export PDF
          </Button>
          <Button
            onClick={() => setShowShare(true)}
            className="bg-white text-background text-[10px] font-black h-8 px-4 uppercase tracking-widest gap-1.5 hover:opacity-90"
          >
            <Share2 className="h-3 w-3" />
            Share
          </Button>
        </div>
      </div>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 12 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-md bg-[#0a0a0a] border border-white/15 rounded-2xl p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Share this roadmap</h3>
                  <p className="text-[11px] text-white/40">
                    Anyone with this link can view the roadmap.
                  </p>
                </div>
                <button
                  onClick={() => setShowShare(false)}
                  className="text-white/20 hover:text-white/60 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <Globe className="h-3.5 w-3.5 text-white/30 shrink-0" />
                <span className="flex-1 text-[11px] text-white/50 font-mono truncate">{shareUrl}</span>
              </div>
              <Button
                onClick={handleCopy}
                className="w-full h-10 bg-white text-background text-[11px] font-black uppercase tracking-widest hover:opacity-90 gap-2"
              >
                {copied ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Copied!</>
                ) : (
                  <><Share2 className="h-3.5 w-3.5" /> Copy Link</>
                )}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={printRef} className="print-page max-w-5xl mx-auto px-8 py-12 space-y-16">
        {/* Header */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="print-header-badge bg-white text-background text-[9px] font-black px-2 py-0.5 rounded uppercase">
                {mode === "client" ? "Client" : "Employee"} Onboarding
              </span>
              <span className="text-[10px] font-mono text-white/20 uppercase">
                Cortex Engine · {new Date(createdAt).toLocaleDateString()}
              </span>
              <span className="text-[9px] font-mono text-white/10 uppercase">ID: {id}</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight">{roadmap.title}</h1>
            <p className="text-base text-white/50 font-medium">{roadmap.subtitle}</p>
          </div>
          <p className="text-sm text-white/50 leading-relaxed max-w-3xl border-l-2 border-white/10 pl-4">
            {roadmap.summary}
          </p>
        </div>

        {/* Phases */}
        <div className="space-y-12">
          <h2 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Phased Roadmap</h2>
          {roadmap.phases.map((phase, phaseI) => (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseI * 0.1 }}
              className={`print-phase rounded-[2rem] border ${phaseColors[phaseI] ?? "border-white/8"} bg-white/[0.02] overflow-hidden`}
            >
              <div className="px-8 py-6 border-b print-divider border-white/5 flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                      <span className="text-[10px] font-black text-white/60">{String(phaseI + 1).padStart(2, "0")}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white">{phase.label}</h3>
                  </div>
                  <p className="text-[11px] text-white/40 leading-relaxed max-w-xl pl-10">{phase.objective}</p>
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase shrink-0 mt-1">{phase.duration}</Badge>
              </div>

              <div className="divide-y divide-white/5">
                {phase.milestones.map((ms, msI) => {
                  const pc = PRIORITY_CONFIG[ms.priority] ?? PRIORITY_CONFIG.medium;
                  return (
                    <div key={ms.id} className="print-milestone px-8 py-6 group hover:bg-white/[0.02] transition-all">
                      <div className="flex items-start gap-5">
                        <div className="mt-0.5 w-5 h-5 rounded-full border border-white/15 flex items-center justify-center shrink-0">
                          <span className="text-[8px] text-white/30">{msI + 1}</span>
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h4 className="text-sm font-bold text-white">{ms.title}</h4>
                            <span className={`print-badge-${ms.priority} text-[9px] font-black px-2 py-0.5 rounded uppercase ${pc.color}`}>
                              {pc.label}
                            </span>
                            <span className="text-[9px] text-white/20 font-mono flex items-center gap-1">
                              <BookOpen className="h-2.5 w-2.5" /> {ms.source}
                            </span>
                          </div>
                          <p className="text-[12px] text-white/50 leading-relaxed">{ms.description}</p>
                          {ms.tasks.length > 0 && (
                            <ul className="space-y-1.5 pt-1">
                              {ms.tasks.map((task, ti) => (
                                <li key={ti} className="flex items-start gap-2 text-[11px] text-white/40">
                                  <ArrowRight className="h-3 w-3 text-white/20 mt-0.5 shrink-0" />
                                  {task}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom panels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print-break">
          {roadmap.keyContacts.length > 0 && (
            <div className="print-section md:col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/8 space-y-4">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Key Contacts</h3>
              <div className="space-y-3">
                {roadmap.keyContacts.map((c, i) => (
                  <div key={i} className="space-y-0.5">
                    <p className="text-[11px] font-bold text-white/80">{c.role}</p>
                    <p className="text-[10px] text-white/30 leading-relaxed">{c.purpose}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="print-section md:col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/8 space-y-4">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="h-3 w-3" /> Success Metrics
            </h3>
            <ul className="space-y-2">
              {roadmap.successMetrics.map((m, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-white/50">
                  <Star className="h-3 w-3 text-white/20 mt-0.5 shrink-0" /> {m}
                </li>
              ))}
            </ul>
          </div>

          <div className="print-section md:col-span-1 p-6 rounded-2xl bg-white/[0.02] border border-white/8 space-y-4">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
              <Shield className="h-3 w-3" /> Watch Out For
            </h3>
            <ul className="space-y-2">
              {roadmap.redFlags.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-white/50">
                  <AlertTriangle className="h-3 w-3 text-white/20 mt-0.5 shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="no-print flex items-center justify-center pb-8">
          <p className="text-[9px] text-white/15 font-mono uppercase">
            Generated by Cortex Intelligence Engine · Roadmap ID: {id}
          </p>
        </div>
      </div>
    </div>
  );
}
