"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { getRoadmapById, type SavedRoadmap } from "@/lib/roadmap-store";
import RoadmapView from "../RoadmapView";

export default function RoadmapByIdPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saved, setSaved] = useState<SavedRoadmap | null | "loading">("loading");

  useEffect(() => {
    setSaved(getRoadmapById(id) ?? null);
  }, [id]);

  if (saved === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-white/30 text-sm font-mono">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-white/30"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          Loading roadmap…
        </div>
      </div>
    );
  }

  if (!saved) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background gap-6 p-6">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-white/40" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-base font-bold text-white">Roadmap not found</h2>
          <p className="text-[12px] text-white/40 max-w-xs leading-relaxed">
            This roadmap ID doesn&apos;t exist in your local storage. Roadmaps are stored in the browser where they were generated.
          </p>
          <p className="text-[10px] font-mono text-white/20 uppercase">ID: {id}</p>
        </div>
        <button
          onClick={() => router.push("/tools/onboarding-copilot")}
          className="flex items-center gap-2 text-[11px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest font-bold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Onboarding Hub
        </button>
      </div>
    );
  }

  return (
    <RoadmapView
      saved={saved}
      onReset={() => router.push("/tools/onboarding-copilot")}
    />
  );
}
