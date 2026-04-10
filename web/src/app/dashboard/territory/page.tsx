"use client";

import { useState, useMemo } from "react";
import { useNeuralStore } from "@/lib/store";
import type { SeedNode, SeedSyncLog } from "@/lib/neural-seed";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, ChevronRight, X, Database, GitBranch,
  BookOpen, MessageSquare, Trello, Slack, Layers,
  FileText, Network, Cpu, Brain, AlertCircle,
  CheckCircle2, Clock, ArrowRight, Zap,
} from "lucide-react";

// ── Source metadata ──────────────────────────────────────────────────────────
const SOURCE_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  NOTION:     { label: "Notion",     icon: BookOpen,      color: "text-white/60" },
  GITHUB:     { label: "GitHub",     icon: GitBranch,     color: "text-white/60" },
  JIRA:       { label: "Jira",       icon: Layers,        color: "text-white/60" },
  SLACK:      { label: "Slack",      icon: MessageSquare, color: "text-white/60" },
  INTERCOM:   { label: "Intercom",   icon: Brain,         color: "text-white/60" },
  TRELLO:     { label: "Trello",     icon: Database,      color: "text-white/60" },
  CONFLUENCE: { label: "Confluence", icon: FileText,      color: "text-white/60" },
  INTERNAL:   { label: "Internal",   icon: Cpu,           color: "text-white/60" },
};

const NODE_TYPE_COLORS: Record<string, string> = {
  source:   "bg-white/10 text-white/60",
  entity:   "bg-white/8  text-white/50",
  concept:  "bg-white/6  text-white/40",
  project:  "bg-white/12 text-white/65",
  decision: "bg-white/8  text-white/55",
  analysis: "bg-white/6  text-white/45",
};

// ── Node detail drawer ───────────────────────────────────────────────────────
function NodeDrawer({ node, syncLog, onClose }: { node: SeedNode; syncLog?: SeedSyncLog; onClose: () => void }) {
  const meta = SOURCE_META[node.source] ?? SOURCE_META.INTERNAL;
  const Icon = meta.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ duration: 0.2 }}
      className="fixed right-0 top-0 h-full w-[360px] bg-background border-l border-white/8 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-white/40" />
          </div>
          <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{meta.label}</span>
        </div>
        <button onClick={onClose} className="text-white/20 hover:text-white/60 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Node info */}
        <div className="space-y-3">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Node</p>
          <h2 className="text-lg font-black text-white leading-snug">{node.label}</h2>
          <div className="flex items-center gap-2">
            <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded-full", NODE_TYPE_COLORS[node.type])}>
              {node.type}
            </span>
            <span className="text-[9px] font-mono text-white/20">{node.id}</span>
          </div>
        </div>

        {/* Source */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Connected via</p>
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-white/40" />
            <span className="text-[12px] font-bold text-white/70">{meta.label}</span>
            <CheckCircle2 className="h-3 w-3 text-white/30 ml-auto" />
          </div>
        </div>

        {/* Content Preview */}
        {node.content && (
          <div className="space-y-3">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Content Preview</p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 max-h-[300px] overflow-y-auto no-scrollbar">
              <pre className="text-[10px] text-white/50 whitespace-pre-wrap font-mono leading-relaxed">
                {node.content}
              </pre>
            </div>
          </div>
        )}

        {/* Sync log if available */}
        {syncLog && (
          <div className="space-y-3">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">Last Sync</p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-white/30" />
                <span className="text-[10px] font-mono text-white/40">{syncLog.timestamp}</span>
              </div>
              <p className="text-[11px] font-bold text-white/70">{syncLog.title}</p>
              <p className="text-[10px] text-white/40 leading-relaxed">{syncLog.description}</p>
              {syncLog.impact.length > 0 && (
                <div className="pt-2 space-y-1.5">
                  <p className="text-[9px] font-black text-white/20 uppercase">Impacted nodes</p>
                  {syncLog.impact.map(imp => (
                    <div key={imp} className="flex items-center gap-1.5">
                      <ArrowRight className="h-2.5 w-2.5 text-white/20 shrink-0" />
                      <span className="text-[10px] text-white/40">{imp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Type description */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/6 space-y-2">
          <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Node Type</p>
          <p className="text-[11px] text-white/50 leading-relaxed">
            {node.type === "source"   && "Raw ingested document from a connected integration."}
            {node.type === "entity"   && "A named object (person, org, workspace) extracted from source data."}
            {node.type === "concept"  && "An abstracted idea or theme detected across multiple sources."}
            {node.type === "project"  && "A tracked initiative or workstream imported from a project tool."}
            {node.type === "decision" && "An explicit decision or ADR recorded in source documents."}
            {node.type === "analysis" && "An AI-generated insight derived from cross-source analysis."}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function TerritoryMapPage() {
  const { liveNodes, connectedApps, syncLogs } = useNeuralStore();
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<SeedNode | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Group live nodes by source app
  const sectors = useMemo(() => {
    const grouped: Record<string, SeedNode[]> = {};
    for (const node of liveNodes) {
      const src = node.source.toUpperCase();
      if (!grouped[src]) grouped[src] = [];
      grouped[src].push(node);
    }
    return Object.entries(grouped)
      .map(([src, nodes]) => {
        const typeCounts = nodes.reduce<Record<string, number>>((acc, n) => {
          acc[n.type] = (acc[n.type] ?? 0) + 1;
          return acc;
        }, {});
        const log = syncLogs.find(l => l.source.toUpperCase() === src);
        return { src, nodes, typeCounts, log };
      })
      .sort((a, b) => b.nodes.length - a.nodes.length);
  }, [liveNodes, syncLogs]);

  // All types present across all nodes for filter pills
  const allTypes = useMemo(() => {
    const set = new Set(liveNodes.map(n => n.type));
    return Array.from(set);
  }, [liveNodes]);

  const totalNodes = liveNodes.length;
  const totalSectors = sectors.length;

  // Find sync log for selected node's source
  const selectedLog = selectedNode
    ? syncLogs.find(l => l.source.toUpperCase() === selectedNode.source.toUpperCase())
    : undefined;

  // ── Empty state ──
  if (connectedApps.length === 0 || liveNodes.length === 0) {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="flex h-16 items-center border-b border-white/5 px-8">
          <span className="text-lg font-bold tracking-tight text-white uppercase">Territory Map</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Network className="h-8 w-8 text-white/20" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h2 className="text-lg font-black text-white">No data sources connected</h2>
            <p className="text-sm text-white/40">Connect apps like Notion, GitHub, Jira or Slack from the Wiki Health page to populate your territory map.</p>
          </div>
          <a href="/tools/wiki-health"
            className="flex items-center gap-2 text-[11px] font-black text-white/50 hover:text-white border border-white/10 hover:border-white/30 rounded-xl px-4 py-2.5 transition-all uppercase tracking-widest"
          >
            <Zap className="h-3.5 w-3.5" /> Connect Sources
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background antialiased">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-white/5 px-8 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold tracking-tight text-white uppercase">Territory Map</span>
          <div className="h-5 w-px bg-white/10" />
          <span className="text-[10px] font-mono text-white/30 uppercase">
            {totalNodes} nodes · {totalSectors} sources · {connectedApps.length} apps connected
          </span>
        </div>
        {/* Type filter pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterType(null)}
            className={cn(
              "text-[9px] font-black uppercase px-2.5 py-1 rounded-full transition-all",
              filterType === null ? "bg-white text-background" : "bg-white/5 text-white/30 hover:bg-white/10"
            )}
          >All</button>
          {allTypes.map(t => (
            <button key={t}
              onClick={() => setFilterType(filterType === t ? null : t)}
              className={cn(
                "text-[9px] font-black uppercase px-2.5 py-1 rounded-full transition-all",
                filterType === t ? "bg-white text-background" : "bg-white/5 text-white/30 hover:bg-white/10"
              )}
            >{t}</button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-auto no-scrollbar p-6">
        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Nodes",   value: String(totalNodes) },
            { label: "Sources",       value: String(totalSectors) },
            { label: "Apps",          value: String(connectedApps.length) },
            { label: "Syncs",         value: String(syncLogs.filter(l => l.status === "completed").length) },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl border border-white/6 bg-white/[0.02]">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">{s.label}</p>
              <p className="text-2xl font-black text-white mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Sector grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map(({ src, nodes, typeCounts, log }) => {
            const meta    = SOURCE_META[src] ?? SOURCE_META.INTERNAL;
            const Icon    = meta.icon;
            const isOpen  = expandedSector === src;
            const filtered = filterType ? nodes.filter(n => n.type === filterType) : nodes;

            return (
              <motion.div
                key={src}
                layout
                className={cn(
                  "rounded-2xl border transition-all overflow-hidden",
                  isOpen ? "border-white/20 bg-white/[0.04]" : "border-white/8 bg-white/[0.02] hover:border-white/15"
                )}
              >
                {/* Sector header — clickable to expand */}
                <button
                  className="w-full flex items-center gap-3 p-5 text-left"
                  onClick={() => setExpandedSector(isOpen ? null : src)}
                >
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[12px] font-black text-white uppercase tracking-wide">{meta.label}</p>
                      {log?.alert && <AlertCircle className="h-3 w-3 text-white/50" />}
                    </div>
                    <p className="text-[10px] text-white/30 font-mono mt-0.5">
                      {nodes.length} nodes · {Object.keys(typeCounts).length} types
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log && (
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2 py-0.5 rounded-full",
                        log.status === "completed" ? "bg-white/8 text-white/40" : "bg-white/15 text-white/60 animate-pulse"
                      )}>{log.status}</span>
                    )}
                    {isOpen
                      ? <ChevronDown className="h-3.5 w-3.5 text-white/30" />
                      : <ChevronRight className="h-3.5 w-3.5 text-white/20" />}
                  </div>
                </button>

                {/* Type count pills */}
                <div className="px-5 pb-3 flex flex-wrap gap-1.5">
                  {Object.entries(typeCounts).map(([type, count]) => (
                    <span key={type} className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded-full", NODE_TYPE_COLORS[type])}>
                      {count} {type}
                    </span>
                  ))}
                </div>

                {/* Expanded node list */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {/* Sync log summary */}
                      {log && (
                        <div className="mx-5 mb-3 p-3 rounded-xl bg-white/[0.03] border border-white/6 space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-2.5 w-2.5 text-white/25" />
                            <span className="text-[9px] font-mono text-white/25">{log.timestamp}</span>
                          </div>
                          <p className="text-[10px] text-white/50 leading-relaxed">{log.description}</p>
                        </div>
                      )}

                      <div className="px-5 pb-4 space-y-1.5">
                        {filtered.length === 0 && (
                          <p className="text-[10px] text-white/25 py-2">No nodes match this filter.</p>
                        )}
                        {filtered.map((node, i) => (
                          <motion.button
                            key={node.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => setSelectedNode(node)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/15 transition-all text-left group"
                          >
                            <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", 
                              node.val ? "bg-white/70" : "bg-white/25"
                            )} />
                            <span className="text-[11px] font-medium text-white/70 flex-1 truncate">{node.label}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full", NODE_TYPE_COLORS[node.type])}>
                                {node.type}
                              </span>
                              <ArrowRight className="h-2.5 w-2.5 text-white/15 group-hover:text-white/40 transition-colors" />
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Sync log timeline */}
        {syncLogs.length > 0 && (
          <div className="mt-8 space-y-3">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] px-1">Sync Timeline</p>
            <div className="space-y-2">
              {syncLogs.slice(0, 8).map((log, i) => {
                const meta = SOURCE_META[log.source.toUpperCase()] ?? SOURCE_META.INTERNAL;
                const Icon = meta.icon;
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="h-3 w-3 text-white/30" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] font-bold text-white/60 truncate">{log.title}</p>
                        {log.alert && <AlertCircle className="h-3 w-3 text-white/40 shrink-0" />}
                      </div>
                      <p className="text-[9px] text-white/30">{log.timestamp}</p>
                    </div>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded-full shrink-0",
                      log.status === "completed" ? "bg-white/6 text-white/30" : "bg-white/12 text-white/50 animate-pulse"
                    )}>{log.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Node detail drawer */}
      <AnimatePresence>
        {selectedNode && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
              onClick={() => setSelectedNode(null)}
            />
            <NodeDrawer node={selectedNode} syncLog={selectedLog} onClose={() => setSelectedNode(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
