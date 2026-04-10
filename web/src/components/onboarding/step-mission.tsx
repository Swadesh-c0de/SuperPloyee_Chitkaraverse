"use client";

import { useState } from "react";
import { useOnboardingStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const QUESTIONS = [
  { key: "oneLiner" as const, question: "What does your company do in one sentence?", placeholder: "We build AI-powered tools that help sales teams close deals faster..." },
  { key: "customer" as const, question: "Who is your customer?", placeholder: "Mid-market SaaS companies with 50-500 employees..." },
  { key: "biggestProblem" as const, question: "What is the single biggest problem you're solving?", placeholder: "Sales teams waste 40% of their time on manual data entry instead of selling..." },
];

export function StepMission() {
  const { mission, setMission, nextStep, prevStep } = useOnboardingStore();
  const [questionIndex, setQuestionIndex] = useState(0);
  const current = QUESTIONS[questionIndex];
  const value = mission[current.key];

  const handleNext = () => {
    if (questionIndex < QUESTIONS.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex(questionIndex - 1);
    } else {
      prevStep();
    }
  };

  return (
    <div className="flex flex-col items-center responsive-gap w-full animate-in fade-in duration-700">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 label-sm text-white">
          <Sparkles className="h-4 w-4 text-white animate-pulse shadow-[0_0_10px_white]" />
          <span>Linguistic Training</span>
        </div>
        <div className="flex items-center justify-center gap-3 md:gap-4 py-4">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-0.5 w-10 md:w-16 transition-all duration-700 rounded-full",
                i === questionIndex ? "bg-white shadow-[0_0_10px_white]" : i < questionIndex ? "bg-white/40" : "bg-white/5"
              )}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={questionIndex}
          initial={{ opacity: 0, scale: 0.98, filter: "blur(12px)", x: 20 }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)", x: 0 }}
          exit={{ opacity: 0, scale: 1.02, filter: "blur(12px)", x: -20 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full flex flex-col responsive-gap"
        >
          <h2 className="display-lg text-center leading-[1.1]">
            {current.question}
          </h2>
          <div className="relative group">
            <textarea
              placeholder={current.placeholder}
              value={value}
              onChange={(e) => setMission({ [current.key]: e.target.value })}
              className="w-full min-h-[200px] bg-white/[0.02] border border-white/10 rounded-2xl p-6 md:p-10 text-base md:text-lg font-medium text-white placeholder:text-white/10 focus:outline-none focus:border-white/40 focus:bg-white/[0.04] transition-all focus:ring-glow leading-relaxed resize-none tonal-shift shadow-inner"
              autoFocus
            />
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-6 pt-6">
        <Button variant="ghost" onClick={handleBack} className="label-sm text-white/40 hover:text-white hover:bg-white/5 h-16 px-10 rounded-xl w-full sm:w-auto transition-all">
          <ArrowLeft className="mr-3 h-4.5 w-4.5" />
          SYSTEM BACK
        </Button>
        <Button onClick={handleNext} disabled={!value?.trim()} className="bg-white text-background label-sm h-16 px-14 group hover:opacity-90 transition-all shadow-[0_15px_30px_rgba(255,255,255,0.1)] rounded-xl w-full sm:w-auto">
          {questionIndex < QUESTIONS.length - 1 ? "EXECUTE NEXT" : "COMMIT PROTOCOL"}
          <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
