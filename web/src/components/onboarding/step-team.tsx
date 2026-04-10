"use client";

import { useOnboardingStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { DEPARTMENT_PRESETS } from "@/lib/constants";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function StepTeam() {
  const { departments, toggleDepartment, nextStep, prevStep } = useOnboardingStore();

  const selectedIds = new Set(departments.map((d: any) => d.id));

  return (
    <div className="flex flex-col items-center responsive-gap w-full animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="display-lg">
          Sector <span className="text-white/20">Alignment</span>
        </h1>
        <p className="text-white/40 label-sm max-w-md mx-auto leading-relaxed">
          Define the organizational dimensions to be indexed by the neural net.
        </p>
      </div>

      <div className="grid w-full grid-cols-1 sm:grid-cols-2 responsive-gap">
        {DEPARTMENT_PRESETS.map((dept: any) => {
          const isSelected = selectedIds.has(dept.id);
          return (
            <button
              key={dept.id}
              onClick={() => toggleDepartment(dept)}
              className={cn(
                "group relative flex items-center gap-4 rounded-2xl border p-6 text-left transition-all duration-300 tonal-shift",
                isSelected
                  ? "border-white bg-white/10 shadow-[0_0_25px_rgba(255,255,255,0.05)]"
                  : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              )}
            >
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-all duration-700",
                  isSelected ? "bg-white shadow-[0_0_12px_white] scale-125" : "bg-white/10"
                )}
              />
              <span className={cn(
                "label-sm font-bold tracking-[0.2em] transition-colors duration-500",
                isSelected ? "text-white" : "text-white/20 group-hover:text-white/40"
              )}>
                {dept.name}
              </span>
              {isSelected && (
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                  <Check className="ml-auto h-4.5 w-4.5 text-white" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-6 pt-6">
        <Button variant="ghost" onClick={prevStep} className="label-sm text-white/40 hover:text-white hover:bg-white/5 h-16 px-10 rounded-xl w-full sm:w-auto transition-all">
          <ArrowLeft className="mr-3 h-4.5 w-4.5" />
          PRV_PROTOCOL
        </Button>
        <Button onClick={nextStep} disabled={departments.length === 0} className="bg-white text-background label-sm h-16 px-14 group hover:opacity-90 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)] rounded-xl w-full sm:w-auto">
          NEXT_DIMENSION
          <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
