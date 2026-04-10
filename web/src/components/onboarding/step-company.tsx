"use client";

import { useState } from "react";
import { useOnboardingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COMPANY_SIZE_OPTIONS } from "@/lib/constants";
import { Building2, MapPin, Calendar, Users, ArrowRight } from "lucide-react";

export function StepCompanyIdentity() {
  const { company, setCompany, nextStep } = useOnboardingStore();
  const [name, setName] = useState(company.name);

  const canProceed = name.trim() && company.industry && company.size;

  return (
    <div className="flex flex-col items-center responsive-gap w-full animate-in fade-in zoom-in-95 duration-700">
      <div className="text-center space-y-4">
        <h1 className="display-lg">
          Initialize <span className="text-white/20">your instance</span>
        </h1>
        <p className="text-white/40 label-sm max-w-md mx-auto leading-relaxed">
          The Cortex Protocol requires core identity markers to seed your 
          intellectual neural net.
        </p>
      </div>

      <div className="w-full flex flex-col responsive-gap">
        <div className="relative group">
          <Building2 className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-white transition-colors" />
          <input
            placeholder="ORGANIZATION IDENTIFIER"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setCompany({ name: e.target.value });
            }}
            className="w-full h-16 bg-transparent border-b border-white/10 pl-10 text-xl md:text-2xl font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-white transition-all focus:ring-glow"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 responsive-gap">
          <div className="relative group">
            <input
              placeholder="INDUSTRIAL SECTOR"
              value={company.industry}
              onChange={(e) => setCompany({ industry: e.target.value })}
              className="w-full h-12 bg-transparent border-b border-white/10 text-xs md:text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-white transition-all uppercase tracking-widest"
            />
          </div>
          <div className="relative group">
            <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white" />
            <input
              placeholder="HQ COORDINATES"
              value={company.hqLocation}
              onChange={(e) => setCompany({ hqLocation: e.target.value })}
              className="w-full h-12 bg-transparent border-b border-white/10 pl-8 text-xs md:text-sm font-bold text-white placeholder:text-white/10 focus:outline-none focus:border-white transition-all uppercase tracking-widest"
            />
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="label-sm text-white/20 uppercase tracking-[0.2em]">Deployment Scale</h4>
          <div className="flex flex-wrap gap-3">
            {COMPANY_SIZE_OPTIONS.map((size) => (
              <button
                key={size}
                onClick={() => setCompany({ size })}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-6 py-3.5 transition-all duration-300",
                  company.size === size
                    ? "border-white bg-white text-background shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                    : "border-white/5 bg-white/5 text-white/40 hover:border-white/20 hover:text-white"
                )}
              >
                <Users className="h-4 w-4" />
                <span className="label-sm font-bold">{size} UNITS</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={nextStep}
        disabled={!canProceed}
        className="h-20 w-full bg-white text-background label-sm group hover:opacity-90 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] rounded-xl"
      >
        PROCEED TO MISSION PROTOCOL
        <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
}
