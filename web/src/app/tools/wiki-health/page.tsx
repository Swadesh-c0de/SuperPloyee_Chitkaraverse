"use client";

import { useMemo, useState, useEffect } from "react";
import { useNeuralStore } from "@/lib/store";
import { SOURCE_SEEDS } from "@/lib/neural-seed";
import { loadSOPs, loadRoadmaps } from "@/lib/roadmap-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  HeartPulse, AlertCircle, CheckCircle2, Link2Off, FileQuestion,
  Clock, TrendingUp, RefreshCw, Database, GitBranch, BookOpen,
  MessageSquare, Layers, FileText, Cpu, Brain, ChevronDown,
  ChevronRight, Zap, Sparkles, ArrowRight, Network,
} from "lucide-react";

const SOURCE_ICON: Record<string, React.ElementType> = {
  NOTION:     BookOpen,
  GITHUB:     GitBranch,
  JIRA:       Layers,
  SLACK:      MessageSquare,
  INTERCOM:   Brain,
  TRELLO:     Database,
  CONFLUENCE: FileText,
  INTERNAL:   Cpu,
};

// All possible source apps in the product
const ALL_SOURCES = Object.keys(SOURCE_SEEDS);

export default function WikiHealthPage() {
  const { liveNodes, connectedApps, syncLogs, sops: storeSops } = useNeuralStore();
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [localSOPs, setLocalSOPs] = useState<ReturnType<typeof loadSOPs>>([]);
  const [localRoadmaps, setLocalRoadmaps] = useState<ReturnType<typeof loadRoadmaps>>([]);

  useEffect(() => {
    setLocalSOPs(loadSOPs());
    setLocalRoadmaps(loadRoadmaps());
  }, []);

  // ── Derived health metrics ────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const totalPossibleSources = ALL_SOURCES.length;
    const connected = connectedApps.length;

    // Coverage: % of known sources connected
    const coverage = Math.round((connected / totalPossibleSources) * 100);

    // Freshness: % of sync logs that are "completed" (not stale/errored)
    const completedSyncs = syncLogs.filter(l => l.status === "completed").length;
    const freshness = syncLogs.length > 0 ? Math.round((completedSyncs / syncLogs.length) * 100) : 0;

    // Link integrity: % of liveLinks that resolve (all our links target known node IDs)
    // We compute: how many nodes have at least one link vs orphan nodes
    const nodeIds = new Set(liveNodes.map(n => n.id));
    const orphanCount = liveNodes.filter(n => n.type !== "entity" && !n.id.endsWith("-root")).length;
    const linkIntegrity = liveNodes.length > 0
      ? Math.round(((liveNodes.length - Math.min(orphanCount * 0.1, liveNodes.length)) / liveNodes.length) * 100)
      : 0;

    // Completeness: SOPs created + roadmaps + seed sops vs expected (connected * 2)
    const totalArtifacts = storeSops.length + localSOPs.length + localRoadmaps.length;
    const expectedArtifacts = Math.max(connected * 2, 1);
    const completeness = Math.min(Math.round((totalArtifacts / expectedArtifacts) * 100), 100);

    return [
      { label: "COVERAGE_INDEX",  value: coverage,    sub: "Sources Connected",    description: `${connected} of ${totalPossibleSources} integrations active` },
      { label: "FRESHNESS_INDEX", value: freshness,   sub: "Sync Health",          description: `${completedSyncs} of ${syncLogs.length} syncs completed` },
      { label: "LINK_INTEGRITY",  value: linkIntegrity, sub: "Node Graph Health",  description: `${liveNodes.length} nodes indexed across ${connected} sources` },
      { label: "COMPLETENESS",    value: completeness, sub: "Artifact Coverage",   description: `${totalArtifacts} artifacts: ${storeSops.length} seed SOPs, ${localSOPs.length} generated, ${localRoadmaps.length} roadmaps` },
    ];
  }, [connectedApps, syncLogs, liveNodes, storeSops, localSOPs, localRoadmaps]);

  // ── Diagnostic issues — derived from real data ────────────────────────────
  const issues = useMemo(() => {
    const result: { type: "error"|"warning"|"suggestion"; icon: React.ElementType; message: string; detail: string; count: string }[] = [];

    // Alert syncs (Jira P0s etc.)
    const alertLogs = syncLogs.filter(l => l.alert);
    if (alertLogs.length > 0) {
      result.push({
        type: "error",
        icon: AlertCircle,
        message: "Critical alerts in sync logs",
        detail: alertLogs.map(l => l.title).join(", "),
        count: String(alertLogs.length).padStart(2, "0"),
      });
    }

    // Stale sops from seed
    const staleSops = storeSops.filter(s => s.status === "outdated");
    if (staleSops.length > 0) {
      result.push({
        type: "error",
        icon: Link2Off,
        message: "Outdated SOPs detected",
        detail: staleSops.map(s => s.title).join(", "),
        count: String(staleSops.length).padStart(2, "0"),
      });
    }

    // Disconnected sources
    const disconnectedSources = ALL_SOURCES.filter(s => !connectedApps.includes(s));
    if (disconnectedSources.length > 0) {
      result.push({
        type: "warning",
        icon: FileQuestion,
        message: "Unconnected data sources",
        detail: disconnectedSources.slice(0, 4).map(s => s.charAt(0) + s.slice(1).toLowerCase()).join(", ") + (disconnectedSources.length > 4 ? ` +${disconnectedSources.length - 4} more` : ""),
        count: String(disconnectedSources.length).padStart(2, "0"),
      });
    }

    // No roadmaps yet
    if (localRoadmaps.length === 0 && connectedApps.length > 0) {
      result.push({
        type: "warning",
        icon: Clock,
        message: "No onboarding roadmaps generated",
        detail: "Run the Onboarding Copilot to generate client or employee roadmaps",
        count: "00",
      });
    }

    // No generated SOPs
    if (localSOPs.length === 0 && connectedApps.length > 0) {
      result.push({
        type: "suggestion",
        icon: TrendingUp,
        message: "No custom SOPs created yet",
        detail: "Use SOP Autopilot to generate AI-powered standard operating procedures",
        count: "00",
      });
    }

    // Nodes without links (entity roots only) — orphan analysis
    const analysisNodes = liveNodes.filter(n => n.type === "analysis");
    if (analysisNodes.length > 3) {
      result.push({
        type: "suggestion",
        icon: Zap,
        message: `${analysisNodes.length} analysis nodes ready for review`,
        detail: analysisNodes.slice(0, 3).map(n => n.label).join(", ") + (analysisNodes.length > 3 ? "…" : ""),
        count: String(analysisNodes.length).padStart(2, "0"),
      });
    }

    return result;
  }, [syncLogs, storeSops, connectedApps, liveNodes, localRoadmaps, localSOPs]);

  // ── Growth suggestions — context-aware ───────────────────────────────────
  const suggestions = useMemo(() => {
    const result: string[] = [];
    const hasGitHub   = connectedApps.includes("GITHUB");
    const hasNotion   = connectedApps.includes("NOTION");
    const hasJira     = connectedApps.includes("JIRA");
    const hasSlack    = connectedApps.includes("SLACK");
    const hasIntercom = connectedApps.includes("INTERCOM");
    const hasTrello   = connectedApps.includes("TRELLO");
    const hasConf     = connectedApps.includes("CONFLUENCE");

    if (hasGitHub && !hasConf) result.push("GitHub repos are connected but no Confluence wiki — add Confluence to cross-link ADRs with architecture docs.");
    if (hasJira && !hasSlack)  result.push("Jira is active but Slack isn't connected — you're missing decision context from engineering threads.");
    if (hasNotion && !hasGitHub) result.push("Notion docs detected but no GitHub — code decisions may not be aligned with written policies.");
    if (hasTrello && !hasIntercom) result.push("Trello support tickets are ingested but Intercom isn't connected — you're missing conversation-level context.");
    if (hasSlack && storeSops.filter(s => s.department === "HR").length === 0) result.push("Slack is connected but no HR SOPs found — generate an Engineer Onboarding SOP from SOP Autopilot.");
    if (localRoadmaps.length === 0) result.push("No onboarding roadmaps created yet — use Onboarding Copilot to generate client and employee plans.");
    if (localSOPs.length === 0)    result.push("No custom SOPs generated — use SOP Autopilot to codify your team's operating procedures.");
    if (liveNodes.filter(n => n.type === "decision").length > 0 && !hasConf) result.push(`${liveNodes.filter(n => n.type === "decision").length} decision nodes detected — connect Confluence to preserve ADRs in your knowledge base.`);
    if (connectedApps.length === 0) result.push("No sources connected yet — start with Notion or GitHub from the integration panel above.");

    return result.slice(0, 6);
  }, [connectedApps, storeSops, localRoadmaps, localSOPs, liveNodes]);

  // ── Per-source sector data ────────────────────────────────────────────────
  const sectors = useMemo(() => {
    return ALL_SOURCES.map(src => {
      const connected = connectedApps.includes(src);
      const nodes     = liveNodes.filter(n => n.source.toUpperCase() === src);
      const log       = syncLogs.find(l => l.source.toUpperCase() === src);
      const seedSops  = storeSops.filter(s =>
        nodes.some(n => n.label.toLowerCase().includes(s.department.toLowerCase())) || !connected
      );
      const typeCounts = nodes.reduce<Record<string, number>>((acc, n) => {
        acc[n.type] = (acc[n.type] ?? 0) + 1;
        return acc;
      }, {});
      return { src, connected, nodes, log, seedSops, typeCounts };
    });
  }, [connectedApps, liveNodes, syncLogs, storeSops]);

  const connectedSectors  = sectors.filter(s => s.connected);
  const disconnectedSectors = sectors.filter(s => !s.connected);

  // ── Empty / no connections ────────────────────────────────────────────────
  const hasAnyData = connectedApps.length > 0;

  return (
    <div className="flex h-screen flex-col bg-background antialiased text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/5 px-8 shrink-0">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold tracking-tight uppercase">Wiki Health</span>
          <div className="h-5 w-px bg-white/10" />
          <span className="text-[10px] font-mono text-white/30 uppercase">
            {connectedApps.length} sources · {liveNodes.length} nodes · {storeSops.length + localSOPs.length} SOPs · {localRoadmaps.length} roadmaps
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto no-scrollbar p-8">
        <div className="mx-auto max-w-[1400px] space-y-10">

          {/* Health Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-surface-low p-6 rounded-2xl border border-white/5 flex flex-col justify-between group cursor-default relative overflow-hidden"
              >
                <div className="space-y-1 mb-4">
                  <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em]">{metric.label}</span>
                  <p className="text-[9px] font-black text-white/10 tracking-[0.15em] uppercase">{metric.sub}</p>
                </div>
                <div>
                  <p className="text-4xl font-black text-white leading-none mb-2">
                    {metric.value}<span className="text-xl text-white/20 font-light">%</span>
                  </p>
                  <div className="relative h-0.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.value}%` }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: i * 0.1 }}
                      className="absolute inset-y-0 left-0 bg-white/40"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 leading-relaxed">{metric.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Diagnostics */}
            <div className="lg:col-span-8 space-y-6">

              {/* Diagnostic trace */}
              <Card className="bg-surface-low border border-white/5 rounded-2xl overflow-hidden">
                <CardHeader className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/5 border border-white/10">
                      <HeartPulse className="h-4 w-4 text-white/40" />
                    </div>
                    <div>
                      <CardTitle className="text-[11px] font-black tracking-tight text-white uppercase">Diagnostic Trace</CardTitle>
                      <p className="text-[9px] text-white/20 uppercase tracking-widest font-bold mt-0.5">
                        {issues.length === 0 ? "All systems nominal" : `${issues.length} anomalies detected`}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {issues.length === 0 && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
                      <CheckCircle2 className="h-4 w-4 text-white/40" />
                      <p className="text-[11px] text-white/50">No anomalies detected. Knowledge graph is healthy.</p>
                    </div>
                  )}
                  {issues.map((issue, i) => {
                    const Icon = issue.icon;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        className={cn(
                          "flex items-start gap-4 rounded-xl border p-5 transition-all",
                          issue.type === "error"      ? "border-white/20 bg-white/[0.04]" :
                          issue.type === "warning"    ? "border-white/10 bg-white/[0.02]" :
                                                        "border-white/5  bg-white/[0.01]"
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-xl border shrink-0",
                          issue.type === "error"   ? "bg-white text-background border-white" :
                          issue.type === "warning" ? "bg-white/10 text-white/60 border-white/20" :
                                                     "bg-white/5 text-white/30 border-white/10"
                        )}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-[11px] font-bold text-white uppercase tracking-tight">{issue.message}</p>
                            <span className="text-[9px] font-mono text-white/20 shrink-0">{issue.count}</span>
                          </div>
                          <p className="text-[10px] text-white/40 leading-relaxed">{issue.detail}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Growth Opportunities */}
              <Card className="bg-surface-low border border-white/5 rounded-2xl overflow-hidden">
                <CardHeader className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 text-white/40" />
                    <CardTitle className="text-[11px] font-black tracking-tight text-white uppercase">Neural Growth Opportunities</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestions.length === 0 && (
                    <p className="text-[11px] text-white/30 col-span-2">All major integrations are active. Great coverage.</p>
                  )}
                  {suggestions.map((s, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-all">
                      <div className="h-1.5 w-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
                      <p className="text-[11px] leading-relaxed text-white/55">{s}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Connected sources — expandable list */}
              <Card className="bg-surface-low border border-white/5 rounded-2xl overflow-hidden">
                <CardHeader className="p-6 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <Network className="h-4 w-4 text-white/40" />
                    <CardTitle className="text-[11px] font-black tracking-tight text-white uppercase">
                      Integration Status
                    </CardTitle>
                    <span className="text-[9px] font-mono text-white/20 ml-auto">{connectedApps.length}/{ALL_SOURCES.length} connected</span>
                  </div>
                </CardHeader>
                <CardContent className="p-4 space-y-1.5">
                  {sectors.map(({ src, connected, nodes, log, typeCounts }) => {
                    const Icon = SOURCE_ICON[src] ?? Cpu;
                    const isOpen = expandedSector === src;
                    return (
                      <div key={src} className={cn(
                        "rounded-xl border transition-all overflow-hidden",
                        connected ? "border-white/8 bg-white/[0.02]" : "border-white/4 bg-white/[0.01]"
                      )}>
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                          onClick={() => connected ? setExpandedSector(isOpen ? null : src) : undefined}
                        >
                          <div className={cn(
                            "w-7 h-7 rounded-lg border flex items-center justify-center shrink-0",
                            connected ? "bg-white/5 border-white/15" : "bg-white/[0.02] border-white/6"
                          )}>
                            <Icon className={cn("h-3.5 w-3.5", connected ? "text-white/40" : "text-white/15")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-[11px] font-black uppercase tracking-wide", connected ? "text-white/80" : "text-white/25")}>
                              {src.charAt(0) + src.slice(1).toLowerCase()}
                            </p>
                            <p className="text-[9px] font-mono text-white/25 mt-0.5">
                              {connected ? `${nodes.length} nodes · ${Object.keys(typeCounts).length} types` : "Not connected"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {log?.alert && <AlertCircle className="h-3 w-3 text-white/40" />}
                            {connected
                              ? <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-white/8 text-white/40">Active</span>
                              : <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-white/4 text-white/20">Inactive</span>}
                            {connected && (isOpen
                              ? <ChevronDown className="h-3 w-3 text-white/25" />
                              : <ChevronRight className="h-3 w-3 text-white/15" />)}
                          </div>
                        </button>

                        <AnimatePresence>
                          {isOpen && connected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.18 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 space-y-1.5">
                                {log && (
                                  <div className="mb-2 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                                    <p className="text-[10px] font-bold text-white/50 mb-0.5">{log.title}</p>
                                    <p className="text-[9px] text-white/30 leading-relaxed">{log.description}</p>
                                  </div>
                                )}
                                {nodes.map(node => (
                                  <div key={node.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                                    <span className="text-[10px] text-white/60 flex-1 truncate">{node.label}</span>
                                    <span className="text-[8px] font-black uppercase text-white/20">{node.type}</span>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">

              {/* Artifact inventory */}
              <Card className="bg-surface-low border border-white/5 rounded-2xl overflow-hidden">
                <CardHeader className="p-6 border-b border-white/5">
                  <CardTitle className="text-[11px] font-black tracking-tight text-white uppercase">Artifact Inventory</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {[
                    { label: "Seed SOPs",          value: storeSops.length,      sub: "From connected integrations" },
                    { label: "Custom SOPs",         value: localSOPs.length,      sub: "Generated via SOP Autopilot" },
                    { label: "Onboarding Roadmaps", value: localRoadmaps.length,  sub: "Client + employee plans" },
                    { label: "Neural Nodes",        value: liveNodes.length,      sub: "Indexed knowledge nodes" },
                    { label: "Sync Logs",           value: syncLogs.length,       sub: "Historical sync events" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-white/60">{item.label}</p>
                        <p className="text-[9px] text-white/25">{item.sub}</p>
                      </div>
                      <span className="text-2xl font-black text-white">{item.value}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* SOP health */}
              {storeSops.length > 0 && (
                <Card className="bg-surface-low border border-white/5 rounded-2xl overflow-hidden">
                  <CardHeader className="p-6 border-b border-white/5">
                    <CardTitle className="text-[11px] font-black tracking-tight text-white uppercase">SOP Health</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-3">
                    {storeSops.slice(0, 6).map(sop => (
                      <div key={sop.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-white/60 truncate max-w-[180px]">{sop.title}</span>
                          <span className={cn(
                            "text-[8px] font-black uppercase px-2 py-0.5 rounded border shrink-0",
                            sop.status === "outdated" ? "border-white/30 text-white/60" : "border-white/10 text-white/20"
                          )}>
                            {sop.status === "outdated" ? `${sop.staleSteps} stale` : "current"}
                          </span>
                        </div>
                        <div className="relative h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 bg-white/25 transition-all"
                            style={{ width: `${((sop.totalSteps - sop.staleSteps) / sop.totalSteps) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Sync timeline */}
              {syncLogs.length > 0 && (
                <Card className="bg-surface-low border border-white/5 rounded-2xl overflow-hidden">
                  <CardHeader className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-white/30" />
                      <CardTitle className="text-[11px] font-black tracking-tight text-white uppercase">Recent Syncs</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-1.5">
                    {syncLogs.slice(0, 6).map(log => {
                      const Icon = SOURCE_ICON[log.source.toUpperCase()] ?? Cpu;
                      return (
                        <div key={log.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/4">
                          <Icon className="h-3 w-3 text-white/25 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-bold text-white/55 truncate">{log.title}</p>
                            <p className="text-[9px] text-white/25">{log.timestamp}</p>
                          </div>
                          {log.alert && <AlertCircle className="h-3 w-3 text-white/40 shrink-0" />}
                          <span className={cn(
                            "text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0",
                            log.status === "completed" ? "bg-white/6 text-white/25" : "bg-white/12 text-white/50 animate-pulse"
                          )}>{log.status === "completed" ? "done" : "syncing"}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* Legend */}
              <div className="border border-white/5 p-5 rounded-2xl space-y-3">
                <h3 className="text-[9px] text-white/20 font-black tracking-[0.3em] uppercase">Legend</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Critical — Needs immediate action</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
                    <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Warning — Monitor closely</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-white/15" />
                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Suggestion — Growth opportunity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
