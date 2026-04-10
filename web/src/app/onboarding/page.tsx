"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useOnboardingStore } from "@/lib/store";
import { StepCompanyIdentity } from "@/components/onboarding/step-company";
import { StepMission } from "@/components/onboarding/step-mission";
import { StepTeam } from "@/components/onboarding/step-team";
import { StepUseCases } from "@/components/onboarding/step-use-cases";
import { StepBrainBuild } from "@/components/onboarding/step-brain-build";
import { StepFirstQuery } from "@/components/onboarding/step-first-query";

const STEPS = [
  { component: StepCompanyIdentity, label: "Identity" },
  { component: StepMission, label: "Mission" },
  { component: StepTeam, label: "Team" },
  { component: StepUseCases, label: "Focus" },
  { component: StepBrainBuild, label: "Build" },
  { component: StepFirstQuery, label: "Query" },
];

export default function OnboardingPage() {
  const step = useOnboardingStore((s) => s.step);
  const CurrentStep = STEPS[step]?.component ?? StepCompanyIdentity;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background antialiased selection:bg-white/10 selection:text-white">
      {/* Cinematic Background Atmosphere */}
      <div className="absolute inset-0 bg-[#0d0d0f]" />
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)" }} />
      
      {/* Branding Overlay */}
      <div className="absolute top-6 left-6 md:top-10 md:left-10 flex items-center gap-4 z-20">
        <div className="relative h-10 w-10 flex items-center justify-center rounded-lg border border-white/20 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <span className="relative text-lg font-bold text-white tracking-widest">C</span>
        </div>
        <div className="flex flex-col">
          <span className="text-base md:text-lg font-bold tracking-[0.3em] text-white uppercase leading-none">Cortex</span>
          <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.4em] mt-1.5 hidden sm:block">Protocol v0.8.2</span>
        </div>
      </div>

      {/* Progress Indicators */}
      <div className="absolute top-6 right-6 md:top-10 md:right-10 flex items-center gap-6 z-20 overflow-x-auto no-scrollbar max-w-[calc(100%-10rem)] md:max-w-none justify-end">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex flex-col items-end gap-2 shrink-0">
            <span className={cn(
              "text-[9px] font-bold uppercase tracking-[0.2em] transition-all duration-700",
              i === step ? "text-white scale-110" : i < step ? "text-white/40" : "text-white/10"
            )}>
              {s.label}
            </span>
            <div className={cn(
              "h-0.5 w-8 transition-all duration-700 rounded-full",
              i === step ? "bg-white shadow-[0_0_10px_white] w-12" : i < step ? "bg-white/30" : "bg-white/5"
            )} />
          </div>
        ))}
      </div>

      {/* Main Content Stage */}
      <div className="relative z-10 w-[min(calc(100%-3rem),46rem)] responsive-p glass-panel border border-white/10 rounded-3xl tonal-shift overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
        {/* Background micro-ornament */}
        <div className="absolute top-0 right-0 w-40 h-40 border-t border-r border-white/5 rounded-tr-3xl pointer-events-none hidden lg:block" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(12px)" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <CurrentStep />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer System Status */}
      <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex items-center gap-4 z-20">
        <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">Cortex_Sync_Active</span>
      </div>
    </div>
  );
}
