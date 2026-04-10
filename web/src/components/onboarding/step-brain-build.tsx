"use client";

import { useState, useEffect, useCallback } from "react";
import { submitOnboarding } from "@/lib/actions";
import { useOnboardingStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Node {
  id: number;
  label: string;
  x: number;
  y: number;
  color: string;
  delay: number;
}

interface Edge {
  from: number;
  to: number;
  delay: number;
}

const SAMPLE_NODES: Omit<Node, "x" | "y">[] = [
  { id: 0, label: "Neural Root", color: "#ffffff", delay: 0.2 },
  { id: 1, label: "Identity Matrix", color: "#ffffff", delay: 0.6 },
  { id: 2, label: "Logic Core", color: "#ffffff", delay: 1.0 },
  { id: 3, label: "Sector Mesh", color: "#ffffff", delay: 1.4 },
  { id: 4, label: "Intel Bus", color: "#ffffff", delay: 1.8 },
  { id: 5, label: "Validation Node", color: "#ffffff", delay: 2.2 },
  { id: 6, label: "Context Buffer", color: "#ffffff", delay: 2.6 },
  { id: 7, label: "Schema Map", color: "#ffffff", delay: 3.0 },
  { id: 8, label: "Audit Trace", color: "#ffffff", delay: 3.4 },
  { id: 9, label: "Neural Gap", color: "#ffffff", delay: 3.8 },
];

const SAMPLE_EDGES: Edge[] = [
  { from: 0, to: 1, delay: 0.8 },
  { from: 0, to: 2, delay: 1.2 },
  { from: 1, to: 3, delay: 1.6 },
  { from: 2, to: 5, delay: 2.0 },
  { from: 4, to: 5, delay: 2.4 },
  { from: 1, to: 6, delay: 2.8 },
  { from: 6, to: 7, delay: 3.2 },
  { from: 0, to: 8, delay: 3.6 },
  { from: 7, to: 9, delay: 4.0 },
  { from: 3, to: 4, delay: 2.0 },
];

export function StepBrainBuild() {
  const { company, mission, departments, useCases, nextStep } = useOnboardingStore();
  const [pagesCreated, setPagesCreated] = useState(0);
  const [crossRefs, setCrossRefs] = useState(0);
  const [contradictions, setContradictions] = useState(0);
  const [done, setDone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatePosition = useCallback((id: number) => {
    const angle = (id / SAMPLE_NODES.length) * Math.PI * 2;
    const radius = 140;
    return {
      x: 250 + Math.cos(angle) * radius,
      y: 200 + Math.sin(angle) * radius,
    };
  }, []);

  const nodes: Node[] = SAMPLE_NODES.map((n) => ({
    ...n,
    ...generatePosition(n.id),
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setPagesCreated((p) => {
        if (p >= 124) {
          clearInterval(interval);
          return 124;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setCrossRefs(84), 2500);
    const t2 = setTimeout(() => setContradictions(0), 3500);
    const t3 = setTimeout(async () => {
      setIsSubmitting(true);
      await submitOnboarding({
        company: company.name,
        mission,
        departments,
        useCases: useCases.map(u => (u as any).title || u)
      });
      setIsSubmitting(false);
      setDone(true);
    }, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [company, mission, departments, useCases]);

  return (
    <div className="flex flex-col items-center gap-8 md:gap-12 w-full animate-in fade-in duration-1000">
      <div className="text-center space-y-4">
        <h1 className="display-lg text-white leading-tight uppercase">
          Neural <span className="text-white/20">Assembly</span>
        </h1>
        <p className="text-white/40 label-sm max-w-md mx-auto leading-relaxed uppercase tracking-widest px-4">
          Constructing high-fidelity knowledge graph for {company.name || "UNIDENTIFIED_ENTITY"}.
        </p>
      </div>

      <div className="relative aspect-[5/4] w-full max-w-[500px] glass-panel border border-white/5 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-white/[0.01]" />
        
        <svg viewBox="0 0 500 400" className="absolute inset-0 w-full h-full">
          {SAMPLE_EDGES.map((edge, i) => {
            const fromNode = nodes[edge.from];
            const toNode = nodes[edge.to];
            return (
              <motion.line
                key={i}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="white"
                strokeWidth="0.5"
                initial={{ opacity: 0, pathLength: 0 }}
                animate={{ opacity: 0.1, pathLength: 1 }}
                transition={{ delay: edge.delay, duration: 1.5, ease: "easeInOut" }}
              />
            );
          })}
        </svg>

        {nodes.map((node) => (
          <motion.div
            key={node.id}
            className="absolute flex flex-col items-center gap-1 md:gap-2"
            style={{ left: `${(node.x / 500) * 100}%`, top: `${(node.y / 400) * 100}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: node.delay, duration: 0.8, type: "spring", damping: 15 }}
          >
            <div
              className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-white shadow-[0_0_12px_white]"
            />
            <motion.span
              className="text-[7px] md:text-[9px] font-bold text-white/20 uppercase tracking-[0.2em] whitespace-nowrap"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: node.delay + 0.5 }}
            >
              {node.label}
            </motion.span>
          </motion.div>
        ))}
        
        {/* Center hub */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 rounded-full border border-white/20 flex items-center justify-center">
            <div className="h-1 w-1 bg-white animate-ping" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:flex md:items-center gap-8 md:gap-16 text-center">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="text-2xl md:text-4xl font-bold font-mono text-white mb-1 tabular-nums">{pagesCreated}</div>
          <div className="text-[8px] md:label-sm text-white/20 uppercase tracking-widest">NODES_INDEXED</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: crossRefs > 0 ? 1 : 0, y: 0 }} transition={{ delay: 2.5 }}>
          <div className="text-2xl md:text-4xl font-bold font-mono text-white mb-1 tabular-nums">{crossRefs}</div>
          <div className="text-[8px] md:label-sm text-white/20 uppercase tracking-widest">SYNAPSES_FORMED</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: done ? 1 : 0, y: 0 }} transition={{ delay: 3.5 }} className="col-span-2 md:col-span-1">
          <div className="text-2xl md:text-4xl font-bold font-mono text-white mb-1">OPT</div>
          <div className="text-[8px] md:label-sm text-white/20 uppercase tracking-widest">CALIBRATION</div>
        </motion.div>
      </div>

      {done && (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
            className="w-full flex justify-center"
        >
          <Button onClick={nextStep} className="h-14 md:h-16 px-8 md:px-12 bg-white text-background label-sm group hover:opacity-90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] w-full sm:w-auto">
            INITIALIZE INTERFACE
            <ArrowRight className="ml-3 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      )}
    </div>
  );
}
