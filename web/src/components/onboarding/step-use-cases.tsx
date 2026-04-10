"use client";

import { useOnboardingStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { USE_CASE_OPTIONS } from "@/lib/constants";
import { ArrowRight, ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function StepUseCases() {
  const { useCases, toggleUseCase, nextStep, prevStep } = useOnboardingStore();

  return (
    <div className="flex flex-col items-center responsive-gap w-full animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <h1 className="display-lg">
          Optimization <span className="text-white/20">Nodes</span>
        </h1>
        <p className="text-white/40 label-sm max-w-md mx-auto leading-relaxed uppercase tracking-widest">
          Calibrate the intelligence manifold for specific operational objectives.
        </p>
      </div>

      <div className="flex flex-col w-full responsive-gap">
        {USE_CASE_OPTIONS.map((uc: any) => {
          const isSelected = useCases.includes(uc.id);
          const isDisabled = !isSelected && useCases.length >= 3;
          return (
            <button
              key={uc.id}
              onClick={() => !isDisabled && toggleUseCase(uc.id)}
              disabled={isDisabled}
              className={cn(
                "group relative flex items-start gap-6 rounded-2xl border p-6 md:p-8 text-left transition-all duration-500 tonal-shift shadow-lg",
                isSelected
                  ? "border-white bg-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]"
                  : isDisabled
                  ? "border-white/5 opacity-20 cursor-not-allowed"
                  : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              )}
            >
              <span className="text-3xl md:text-4xl filter grayscale contrast-125 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                {uc.icon}
              </span>
              <div className="flex-1 space-y-1.5 md:space-y-2">
                <div className="label-sm font-bold text-white uppercase mb-1">
                  {uc.label}
                </div>
                <div className="text-[10px] md:text-xs font-bold text-white/20 uppercase tracking-[0.1em] group-hover:text-white/40 transition-colors leading-relaxed">
                  {uc.description}
                </div>
              </div>
              {isSelected && (
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white shadow-[0_0_15px_white]">
                  <Check className="h-4 w-4 text-background" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center label-sm text-white/10 tracking-[0.4em] font-bold py-2">
        {useCases.length} / 03 SYSTEM_VECTORS_LOCKED
      </div>

      <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-6">
        <Button variant="ghost" onClick={prevStep} className="label-sm text-white/40 hover:text-white hover:bg-white/5 h-16 px-10 rounded-xl w-full sm:w-auto transition-all">
          <ArrowLeft className="mr-3 h-4.5 w-4.5" />
          RE_DIMENSION
        </Button>
        <Button onClick={nextStep} disabled={useCases.length === 0} className="bg-white text-background label-sm h-16 px-14 group hover:opacity-90 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)] rounded-xl w-full sm:w-auto">
          CONSTRUCT_NEURAL_BASE
          <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
