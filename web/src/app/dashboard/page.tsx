"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PAGE_TYPE_COLORS } from "@/lib/constants";
import {
  Search,
  Filter,
  Maximize2,
  Activity,
  Network,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import { useOnboardingStore, useNeuralStore } from "@/lib/store";
import { useRouter } from "next/navigation";

function Digit({ digit }: { digit: string }) {
  const isNumber = !isNaN(parseInt(digit));
  
  if (!isNumber) return <span className="tabular-nums">{digit}</span>;

  return (
    <span className="relative inline-block h-[1em] w-[0.6em] overflow-hidden tabular-nums leading-none">
      <motion.span
        initial={{ y: "0%" }}
        animate={{ y: `-${parseInt(digit) * 10}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 20, mass: 1, delay: Math.random() * 0.2 }}
        className="absolute top-0 left-0 w-full flex flex-col"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="h-[1em] flex items-center justify-center shrink-0">
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

function SlotCounter({ value }: { value: string | number }) {
  const str = String(value);
  const digits = useMemo(() => str.split(""), [str]);

  return (
    <span key={str} className="inline-flex items-baseline">
      {digits.map((d, i) => (
        <Digit key={`${i}-${d}`} digit={d} />
      ))}
    </span>
  );
}

const ForceGraph = dynamic(() => import("@/components/dashboard/constellation-graph"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-background/50 backdrop-blur-sm">
      <Loader2 className="h-8 w-8 animate-spin text-white/20" />
    </div>
  ),
});

function MagneticButton({ children, className, onClick, variant = "default" }: any) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  function handleMouseMove(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: mouseX, y: mouseY }}
    >
      <Button 
        onClick={onClick} 
        variant={variant as any} 
        className={cn(className, "relative overflow-hidden group")}
      >
        <motion.div 
            className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
            initial={false}
        />
        {children}
      </Button>
    </motion.div>
  );
}

import { toast } from "sonner";

export default function ConstellationPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const { company } = useOnboardingStore();
  const {
    liveNodes, liveLinks, pendingNodes, pendingLinks,
    connectedApps, isSyncing, setIsSyncing,
  } = useNeuralStore();

  const hasPending = pendingNodes.length > 0;
  const isOffline = connectedApps.length === 0;

  const handleSync = async () => {
    if (!hasPending) return;
    setIsSyncing(true);
    // Snapshot what's pending RIGHT NOW — new connects during sync stay queued
    const snap = useNeuralStore.getState();
    const toAdd = [...snap.pendingNodes];
    const linksToCommit = [...snap.pendingLinks];
    const snapNodeIds = new Set(toAdd.map(n => n.id));

    // Remove only the snapshotted nodes/links from pending immediately
    useNeuralStore.setState((s) => ({
      pendingNodes: s.pendingNodes.filter(n => !snapNodeIds.has(n.id)),
      pendingLinks: s.pendingLinks.filter(
        l => !linksToCommit.find(lc => lc.source === l.source && lc.target === l.target)
      ),
    }));

    // Animate nodes into live graph one by one
    for (let i = 0; i < toAdd.length; i++) {
      await new Promise(r => setTimeout(r, 280));
      useNeuralStore.setState((s) => ({
        liveNodes: s.liveNodes.find(n => n.id === toAdd[i].id)
          ? s.liveNodes
          : [...s.liveNodes, toAdd[i]],
      }));
    }

    // Commit links (no pending wipe — new pending state is preserved)
    useNeuralStore.setState((s) => ({
      liveLinks: [
        ...s.liveLinks,
        ...linksToCommit.filter(
          l => !s.liveLinks.find(ll => ll.source === l.source && ll.target === l.target)
        ),
      ],
    }));

    setIsSyncing(false);
    toast.success("NEURAL_SYNC_COMPLETE", {
      description: `${toAdd.length} node${toAdd.length !== 1 ? "s" : ""} integrated into the knowledge graph.`,
      className: "glass-panel border-white/10 text-white rounded-xl uppercase tracking-widest text-[10px] font-black"
    });
  };

  const graphData = useMemo(() => {
    const nodes = liveNodes.map(n => ({
      id: n.id,
      label: n.label,
      type: n.type,
      source: n.source,
      color: '#ffffff',
      val: n.val ?? 1,
      highlighted: !searchTerm || n.label.toLowerCase().includes(searchTerm.toLowerCase()),
    }));
    return { nodes, links: liveLinks as any[] };
  }, [liveNodes, liveLinks, searchTerm]);

  const displayStats = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    liveNodes.forEach(n => { typeCounts[n.type] = (typeCounts[n.type] || 0) + 1; });
    
    // Logic for more justifiable metrics:
    // Integrity based on app coverage + link density
    const totalPossibleApps = 7;
    const coverageScore = (connectedApps.length / totalPossibleApps) * 60;
    const linkDensity = liveNodes.length > 1 ? (liveLinks.length / liveNodes.length) * 30 : 0;
    const dataScore = liveNodes.length > 0 ? 10 : 0;
    const integrity = Math.min(Math.round(coverageScore + linkDensity + dataScore), 99);

    // Latency based on node complexity (simulated)
    const latencyVal = liveNodes.length === 0 ? 0 : Math.max(2, Math.min(18, 4 + Math.floor(liveNodes.length / 5)));

    return {
      totalFiles: liveNodes.length,
      typeCounts,
      integrity: liveNodes.length === 0 ? 0 : integrity,
      latency: liveNodes.length === 0 ? "0ms" : `${latencyVal}ms`,
    };
  }, [liveNodes, liveLinks, connectedApps]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <header className="w-full h-16 border-b border-white/5 bg-background flex items-center justify-between responsive-p shrink-0 font-sans antialiased tracking-tight">
        <div className="flex items-center gap-6">
          <span className="text-sm md:text-lg font-bold tracking-tight text-white uppercase">{company.name || "Cortex Observatory"}</span>
          <div className="hidden md:flex h-8 w-[1px] bg-white/10 mx-2"></div>
          <div className="relative hidden lg:block group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 h-4 w-4 transition-colors group-focus-within:text-white" />
            <input 
              className="bg-surface-low border border-white/5 h-9 pl-10 pr-4 text-[0.6875rem] tracking-[0.05em] font-semibold uppercase text-white rounded-lg focus:ring-1 focus:ring-white/20 w-80 placeholder:text-white/20 transition-all focus:bg-white/[0.05] focus:border-white/20 hover:border-white/10" 
              placeholder="SEARCH NEURAL NET..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5 transition-all hover:rotate-90 sm:flex hidden rounded-lg">
            <Filter className="h-4.5 w-4.5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white hover:bg-white/5 transition-all active:scale-90 rounded-lg">
            <Maximize2 className="h-4.5 w-4.5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar responsive-p space-y-12 max-w-[1700px] mx-auto w-full pb-32">
        {/* Hero Metric Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 responsive-gap items-stretch">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 flex flex-col justify-center bg-surface-low p-8 md:p-14 lg:p-20 rounded-[2.5rem] relative overflow-hidden border border-white/5 tonal-shift group shadow-2xl"
          >
            {/* Cinematic Background Decoration */}
            <div className="absolute -right-24 -bottom-24 w-96 h-96 border border-white/10 rounded-full pointer-events-none group-hover:scale-110 group-hover:opacity-30 transition-all duration-[2000ms] hidden lg:block ease-out"></div>
            <div className="absolute -right-12 -bottom-12 w-96 h-96 border border-white/5 rounded-full pointer-events-none group-hover:scale-125 group-hover:opacity-20 transition-all duration-[2000ms] hidden lg:block ease-out delay-75"></div>
            
            <div className="relative z-10 text-center md:text-left">
              <p className="label-sm text-white/40 mb-8 flex items-center justify-center md:justify-start gap-4">
                <span className="w-2.5 h-0.5 bg-white shadow-[0_0_15px_white]"></span>
                Neural Integrity Status
              </p>
              <h1 className="display-xl mb-8 leading-none flex items-baseline">
                <SlotCounter value={displayStats.integrity} /><span className="text-white/10 font-light">%</span>
              </h1>
              <h2 className="text-base md:text-xl font-medium text-white/60 tracking-tight max-w-xl mx-auto md:mx-0 leading-relaxed">
                {isOffline
                  ? "Neural net is offline. Connect sources in Feed Sources to begin knowledge synthesis."
                  : hasPending
                  ? `${pendingNodes.length} nodes queued from ${connectedApps.length} source(s). Click INITIALIZE_SYNC to integrate them.`
                  : "Knowledge architecture synchronized. Synaptic processing within optimal parameters."}
              </h2>
              <div className="mt-12 md:mt-16 flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
                <Button 
                  onClick={handleSync}
                  disabled={isSyncing || !hasPending}
                  className="bg-white text-background px-14 py-8 rounded-xl label-sm hover:opacity-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.15)] w-full sm:w-auto overflow-hidden relative disabled:opacity-30"
                >
                  <AnimatePresence mode="wait">
                    {isSyncing ? (
                      <motion.div
                        key="syncing"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>SYNCHRONIZING...</span>
                      </motion.div>
                    ) : (
                      <motion.span
                        key="ready"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                      >
                        INITIALIZE_SYNC
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
                <Button 
                  variant="outline" 
                  className="instrument-border text-white/60 px-14 py-8 rounded-xl label-sm hover:text-white hover:bg-white/10 transition-all w-full sm:w-auto backdrop-blur-md"
                  onClick={() => router.push("/dashboard/signals")}
                >
                  INTEGRITY_LOGS
                </Button>
              </div>
            </div>
          </motion.div>

          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 responsive-gap">
            <motion.div 
                whileHover={{ y: -8, borderColor: "rgba(255,255,255,0.15)" }}
                className="bg-surface-low p-8 md:p-12 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group transition-all duration-500 cursor-pointer min-h-[180px] tonal-shift shadow-xl relative overflow-hidden"
            >
               <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-all">
                  <Network className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
                </div>
                <span className="label-sm text-white/20 uppercase">Scale</span>
              </div>
              <div>
                <p className="display-lg tracking-tighter text-white flex items-baseline">
                  <SlotCounter value={displayStats.totalFiles} />
                </p>
                <p className="label-sm text-white/20 mt-3 tracking-widest">VERIFIED_PATHWAYS</p>
              </div>
            </motion.div>
            
            <motion.div 
                whileHover={{ y: -8, borderColor: "rgba(255,255,255,0.15)" }}
                className="bg-surface-low p-8 md:p-12 rounded-[2.5rem] border border-white/5 flex flex-col justify-between group transition-all duration-500 cursor-pointer min-h-[180px] tonal-shift shadow-xl relative overflow-hidden"
            >
               <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start">
                 <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:border-white/20 transition-all">
                  <Activity className="h-5 w-5 text-white/40 group-hover:text-white transition-colors" />
                </div>
                <span className="label-sm text-white/20 uppercase">Performance</span>
              </div>
              <div>
                <p className="display-lg tracking-tighter text-white flex items-baseline">
                  <SlotCounter value={parseInt(displayStats.latency) || 0} />
                  <span className="text-xl text-white/20 font-light ml-1">ms</span>
                </p>
                <p className="label-sm text-white/20 mt-3 tracking-widest uppercase uppercase text-[9px]">Latency_Optimum</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Constellation Viewport Card */}
        <section className="bg-surface-low rounded-[2.5rem] border border-white/5 overflow-hidden h-[clamp(500px,75vh,900px)] relative tonal-shift group shadow-2xl glass-shine">
          <div className="absolute top-8 md:top-12 left-8 md:left-12 z-20 space-y-4 pointer-events-none">
            <h3 className="text-[10px] md:text-xs text-white font-black tracking-[0.5em] uppercase opacity-90">SYSTEM_NEURAL_MANIFOLD</h3>
            <div className="flex items-center gap-4">
                <div className="relative h-2 w-2">
                    <div className="absolute inset-0 rounded-full bg-white shadow-[0_0_15px_white] animate-pulse" />
                    <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                </div>
                <p className="text-[9px] text-white/40 uppercase tracking-[0.3em] font-bold">Sovereign_Intelligence_Protocol</p>
            </div>
          </div>
          
          <ForceGraph 
            data={graphData} 
            onNodeClick={setSelectedNode} 
            selectedNodeId={selectedNode} 
          />

          <div className="absolute bottom-8 md:bottom-12 left-8 md:left-12 z-20 flex items-center gap-4 max-w-[calc(100%-4rem)] overflow-x-auto no-scrollbar pb-3 pr-8">
            {Object.entries(PAGE_TYPE_COLORS).map(([type, color]) => (
              <motion.div 
                key={type} 
                whileHover={{ y: -6, backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.25)" }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-5 rounded-full border border-white/5 bg-background/80 backdrop-blur-3xl px-7 py-3.5 shrink-0 transition-all cursor-pointer shadow-2xl group/legend"
              >
                <div className="relative h-2 w-2">
                    <div className="absolute inset-[-4px] rounded-full blur-[6px] transition-all group-hover/legend:blur-[10px] opacity-40" style={{ backgroundColor: color }} />
                    <div className="absolute inset-0 rounded-full bg-white/90" />
                </div>
                <span className="text-[9px] text-white/60 tracking-[0.25em] font-black uppercase group-hover/legend:text-white transition-colors">
                  {type}
                </span>
                <div className="w-[1px] h-3 bg-white/10 mx-1" />
                <span className="text-[10px] text-white font-mono opacity-30 group-hover/legend:opacity-80 transition-opacity inline-flex items-center h-3">
                  <SlotCounter value={displayStats.typeCounts[type] || 0} />
                </span>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {selectedNode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20, filter: "blur(20px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.95, y: 20, filter: "blur(20px)" }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                className="absolute inset-x-6 bottom-36 md:top-12 md:right-12 md:bottom-auto md:left-auto md:w-[420px] z-20"
              >
                <div className="glass-panel border border-white/20 p-8 md:p-12 rounded-[2rem] tonal-shift space-y-10 shadow-[0_50px_100px_rgba(0,0,0,0.6)] backdrop-blur-3xl relative overflow-hidden group/inspector">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  
                  <div className="space-y-3 text-center md:text-left">
                    <span className="label-sm text-white/20 tracking-[0.3em] font-bold">NODE_IDENTIFIER</span>
                    <h3 className="display-lg leading-tight">
                        {liveNodes.find((n) => n.id === selectedNode)?.label}
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-3">
                      <span className="label-sm text-white/20 tracking-widest font-bold uppercase">Taxonomy</span>
                      <span className="text-xs text-white font-bold uppercase tracking-[0.2em] px-3 py-1.5 bg-white/5 rounded-lg border border-white/5 block w-fit">{liveNodes.find((n) => n.id === selectedNode)?.type}</span>
                    </div>
                    <div className="space-y-3 text-right md:text-left">
                      <span className="label-sm text-white/20 tracking-widest font-bold uppercase">Synapses</span>
                      <span className="text-xl text-white font-bold tracking-tighter block">{liveLinks.filter((l) => l.source === selectedNode || l.target === selectedNode).length} <span className="text-[10px] uppercase text-white/40 tracking-widest font-mono">Verified</span></span>
                    </div>
                  </div>

                  <div className="h-[1px] w-full bg-white/5"></div>

                  <Button variant="outline" className="w-full text-[10px] md:label-sm instrument-border h-16 hover:bg-white/10 transition-all uppercase tracking-[0.3em] font-black rounded-xl" onClick={() => setSelectedNode(null)}>
                    CLOSE_NODE_PROTOCOL
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
