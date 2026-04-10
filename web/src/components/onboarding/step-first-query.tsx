"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, MessageSquare, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const SUGGESTED_QUERIES = [
  "What are our biggest knowledge gaps right now?",
  "Summarize our company's core value proposition",
  "What decisions have been documented so far?",
  "Where should we focus our next data ingestion?",
];

export function StepFirstQuery() {
  const { prevStep, setCompleted } = useOnboardingStore();
  const [selectedQuery, setSelectedQuery] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const router = useRouter();

  const handleQuery = (query: string) => {
    setSelectedQuery(query);
    setTimeout(() => setShowResult(true), 1500);
  };

  const handleFinish = () => {
    setCompleted(true);
    router.push("/dashboard");
  };

  return (
    <div className="flex flex-col items-center gap-8 md:gap-12 w-full animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="display-lg font-bold tracking-tight text-white leading-tight uppercase">
          Query <span className="text-white/20">Genesis</span>
        </h1>
        <p className="text-white/40 label-sm max-w-md mx-auto leading-relaxed uppercase tracking-widest px-4">
          Interrogate the neural core to verify high-fidelity synchronization.
        </p>
      </div>

      {!selectedQuery ? (
        <div className="w-full space-y-2 md:space-y-3">
          {SUGGESTED_QUERIES.map((q) => (
            <motion.button
              key={q}
              onClick={() => handleQuery(q)}
              className="flex w-full items-start gap-3 md:gap-4 rounded border border-white/5 bg-white/[0.02] p-4 md:p-6 text-left transition-all hover:border-white/20 hover:bg-white/5 group tonal-shift"
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.99 }}
            >
              <MessageSquare className="mt-1 h-4 w-4 text-white/20 group-hover:text-white transition-colors shrink-0" />
              <span className="text-[10px] md:label-sm font-bold text-white/60 group-hover:text-white uppercase tracking-wider">{q}</span>
            </motion.button>
          ))}
        </div>
      ) : (
        <div className="w-full space-y-4 md:space-y-6">
          <div className="rounded border border-white/20 bg-white/5 p-4 md:p-6 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <div className="flex items-start gap-3 md:gap-4">
              <MessageSquare className="mt-1 h-4 w-4 text-white shrink-0" />
              <span className="text-[10px] md:label-sm font-bold text-white uppercase tracking-wider">{selectedQuery}</span>
            </div>
          </div>

          {!showResult ? (
            <div className="flex items-center gap-4 rounded border border-white/5 bg-white/[0.02] p-4 md:p-6">
              <div className="h-4 w-4 animate-spin rounded-full border border-white/20 border-t-white" />
              <span className="text-[10px] md:label-sm text-white/20 uppercase tracking-[0.2em] animate-pulse">Consulting neural layers...</span>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 md:space-y-6"
            >
              <div className="glass-panel border border-white/10 p-6 md:p-8 rounded-xl tonal-shift">
                <div className="mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                  <span className="text-[10px] md:label-sm font-bold text-white uppercase tracking-[0.2em]">Intel Briefing • 124 Sources</span>
                </div>
                <p className="text-xs md:text-sm leading-relaxed text-white/80 font-medium italic">
                  &quot;The organizational neural net for this instance is now fully operational. 
                  Core identity markers have been successfully mapped across major sectors. 
                  Immediate action recommended: Ingest operational data streams to bridge 
                  current visibility gaps.&quot;
                </p>
                <div className="mt-6 md:mt-8 flex flex-wrap gap-4 pt-6 border-t border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] md:text-[10px] font-bold text-white/20 uppercase tracking-widest">Confidence</span>
                    <span className="text-[10px] md:label-sm text-white uppercase font-bold tracking-widest">0.98 NOMINAL</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[8px] md:text-[10px] font-bold text-white/20 uppercase tracking-widest">Sources</span>
                    <span className="text-[10px] md:label-sm text-white uppercase font-bold tracking-widest">124 NODES</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleFinish} className="w-full h-14 md:h-16 bg-white text-background label-sm group hover:opacity-90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                ENTER THE CORE
                <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </motion.div>
          )}
        </div>
      )}

      {!selectedQuery && (
        <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-4 md:gap-6 pt-6 md:pt-8">
          <Button variant="ghost" onClick={prevStep} className="label-sm text-white/40 hover:text-white hover:bg-white/5 h-12 md:h-14 px-8 w-full sm:w-auto">
            <ArrowLeft className="mr-3 h-4 w-4" />
            RE_CONSTRUCT
          </Button>
          <Button variant="ghost" onClick={handleFinish} className="text-[10px] md:label-sm text-white/10 hover:text-white/40 transition-colors uppercase tracking-[0.2em] w-full sm:w-auto">
            SKIP_LINKAGE
          </Button>
        </div>
      )}
    </div>
  );
}
