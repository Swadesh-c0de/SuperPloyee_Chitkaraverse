"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Activity,
  FileText,
  AlertTriangle,
  Search,
  RefreshCw,
  ArrowUpRight,
  Database,
  Hash,
  GitBranch,
  Globe,
  HardDrive,
  MessageSquare,
  Clock,
  Loader2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import { useNeuralStore } from "@/lib/store";
import type { SeedNode, SeedLink } from "@/lib/neural-seed";

const SOURCE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  github: { icon: GitBranch, label: "GITHUB_REPOS", color: "text-white/50" },
  notion: { icon: Database, label: "NOTION_VAULT", color: "text-white/60" },
  slack: { icon: Hash, label: "SLACK_CHANNELS", color: "text-white/40" },
  drive: { icon: HardDrive, label: "GOOGLE_DRIVE", color: "text-white/30" },
  intercom: { icon: Globe, label: "INTERCOM_LOGS", color: "text-white/40" },
  jira: { icon: Activity, label: "JIRA_PROJECTS", color: "text-white/50" },
  confluence: { icon: FileText, label: "CONFLUENCE_WIKI", color: "text-white/40" },
  manual: { icon: FileText, label: "MANUAL_INGEST", color: "text-white/70" },
};

const DEMO_SYNCS = [
  {
    id: "1",
    timestamp: "2 MINUTES AGO",
    source: "slack",
    title: "Ingested: #product-strategy archives",
    description: "Extracted 14 key decisions regarding the Q3 roadmap and mobile prioritization.",
    impact: ["Product Roadmap", "Mobile Strategy"],
    status: "completed",
  },
  {
    id: "2",
    timestamp: "8 MINUTES AGO",
    source: "notion",
    title: "Sync: Engineering Wiki (Compliance)",
    description: "Neural scan detected 3 stale security protocols. Dispatched signals to SOP Autopilot.",
    impact: ["Security SOP", "Compliance Roadmap"],
    status: "completed",
    alert: true,
  },
  {
    id: "3",
    timestamp: "15 MINUTES AGO",
    source: "intercom",
    title: "Ingested: Customer Support Feedback",
    description: "Analyzed 142 recent interactions. Satisfaction index updated to 89%.",
    impact: ["Customer Intelligence", "Satisfaction Index"],
    status: "completed",
  },
  {
    id: "4",
    timestamp: "1 HOUR AGO",
    source: "github",
    title: "Sync: repository/cortex-core",
    description: "Merged 4 architectural decision records (ADRs) into the knowledge base.",
    impact: ["System Architecture", "Tech Debt"],
    status: "completed",
  },
  {
    id: "5",
    timestamp: "JUST NOW",
    source: "drive",
    title: "Synchronizing: Q4 Financial Projections",
    description: "Scanning spreadsheet vectors for temporal alignment with market data.",
    impact: ["Financial Model", "Market Analysis"],
    status: "syncing",
  },
  {
    id: "6",
    timestamp: "3 HOURS AGO",
    source: "manual",
    title: "Ingested: Board Meeting Minutes",
    description: "Manual ingest of October strategy session. 8 action items extracted.",
    impact: ["Executive Strategy", "Board Alignment"],
    status: "completed",
  },
];

export default function SyncHistoryPage() {
  const { syncLogs, connectedApps } = useNeuralStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  
  // GitHub org connection UI state
  const [githubUrl, setGithubUrl] = useState("");
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);
  const [connectedOrg, setConnectedOrg] = useState<any>(null);
  const [orgRepos, setOrgRepos] = useState<any[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleConnectGithub = async () => {
    if (!githubUrl.includes("github.com/")) return;
    setIsConnectingGithub(true);
    setSyncStatus("RESOLVING_ORG...");

    try {
      await new Promise(r => setTimeout(r, 600));
      setSyncStatus("FETCHING_REPOSITORIES...");

      const res = await fetch("/api/github-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: githubUrl }),
      });

      if (!res.ok) throw new Error("Failed to fetch org");
      const data = await res.json();

      setSyncStatus(data.mode === "single" ? "INDEXING_REPO..." : `INDEXING_${data.total}_REPOS...`);
      await new Promise(r => setTimeout(r, 800));
      setSyncStatus("BUILDING_KNOWLEDGE_NODES...");
      await new Promise(r => setTimeout(r, 600));

      // Build nodes for every repo
      const orgNodeId = `github-org-${data.org}`;
      const newNodes: SeedNode[] = [
        {
          id: orgNodeId,
          label: `GitHub: ${data.entityMeta?.name || data.org}`,
          type: "entity",
          source: "GITHUB",
          val: 5,
          content: `GitHub ${data.entityType}: ${data.entityMeta?.name || data.org}. ${data.entityMeta?.description || ""} Public repos: ${data.total}.`,
        },
        ...data.repos.map((r: any) => ({
          id: r.id,
          label: r.name,
          type: "source" as const,
          source: "GITHUB",
          val: 2,
          content: [
            `Repository: ${r.fullName}`,
            r.description ? `Description: ${r.description}` : "",
            `Language: ${r.language}`,
            `Stars: ${r.stars} · Forks: ${r.forks} · Open issues: ${r.openIssues}`,
            r.topics.length ? `Topics: ${r.topics.join(", ")}` : "",
            `Default branch: ${r.defaultBranch}`,
            `Last updated: ${new Date(r.updatedAt).toLocaleDateString()}`,
            r.isArchived ? "Status: Archived" : "Status: Active",
            `URL: ${r.url}`,
          ].filter(Boolean).join(" | "),
        })),
      ];

      const newLinks: SeedLink[] = data.repos.map((r: any) => ({
        source: orgNodeId,
        target: r.id,
      }));

      // Persist to store
      useNeuralStore.setState(s => ({
        liveNodes: [
          ...s.liveNodes,
          ...newNodes.filter(n => !s.liveNodes.find(ln => ln.id === n.id)),
        ],
        liveLinks: [
          ...s.liveLinks,
          ...newLinks.filter(l => !s.liveLinks.find(ll => ll.source === l.source && ll.target === l.target)),
        ],
        connectedApps: s.connectedApps.includes("GITHUB") ? s.connectedApps : [...s.connectedApps, "GITHUB"],
      }));

      useNeuralStore.getState().addSyncLog({
        id: `sync-github-org-${Date.now()}`,
        source: "github",
        timestamp: "JUST NOW",
        title: `Synced: ${data.entityMeta?.name || data.org} (${data.total} repos)`,
        description: `Indexed ${data.total} public repositories from ${data.org}. All repos added to knowledge graph.`,
        impact: data.repos.slice(0, 5).map((r: any) => r.name),
        status: "completed",
      });

      setConnectedOrg(data.entityMeta || { name: data.org });
      setOrgRepos(data.repos);
    } catch (err) {
      console.error("GitHub org fetch error:", err);
      setSyncStatus("ERROR — check URL and try again");
    } finally {
      setIsConnectingGithub(false);
      setSyncStatus(null);
    }
  };

  const filteredSyncs = selectedSource
    ? syncLogs.filter((sync) => sync.source === selectedSource)
    : syncLogs;

  return (
    <div className="flex h-screen flex-col bg-background antialiased text-white">
      <header className="flex h-16 items-center justify-between border-b border-white/5 px-8 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight uppercase">Sync History</span>
          <div className="hidden md:flex h-8 w-[1px] bg-white/10 mx-2"></div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 px-3 py-1 rounded bg-white/5 border border-white/5">
              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
              <span className="text-[10px] font-black tracking-widest text-white uppercase">Neural_Link: Active</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="instrument-border text-white/60 label-sm px-6 py-5 rounded-xl hover:text-white transition-all flex items-center gap-2"
          >
            {isRefreshing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            REFRESH_SYNAPSE
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex">
        {/* Connection Status Sidebar */}
        <aside className="w-72 border-r border-white/5 p-8 space-y-8 overflow-y-auto no-scrollbar">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-white/20 font-black tracking-[0.3em] uppercase">Enterprise_Sources</p>
              {selectedSource && (
                <button 
                  onClick={() => setSelectedSource(null)}
                  className="text-[9px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                >
                  CLEAR
                </button>
              )}
            </div>
            <div className="space-y-2">
              {Object.entries(SOURCE_CONFIG).filter(([key]) => connectedApps.includes(key.toUpperCase())).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = selectedSource === key;
                return (
                  <div 
                    key={key} 
                    onClick={() => setSelectedSource(isActive ? null : key)}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                      isActive 
                        ? "bg-white/10 border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                        : "bg-white/[0.02] border-white/5 hover:border-white/10"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn("h-4 w-4", isActive ? "text-white" : config.color)} />
                      <span className={cn(
                        "text-[10px] font-bold transition-colors",
                        isActive ? "text-white" : "text-white/60 group-hover:text-white"
                      )}>{config.label}</span>
                    </div>
                    <div className={cn(
                      "h-1 w-1 rounded-full transition-colors shadow-white shadow-[0_0_5px]",
                      isActive ? "bg-white" : "bg-white/20 group-hover:bg-white"
                    )} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* GitHub Connection UI */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <p className="text-[10px] text-white/20 font-black tracking-[0.3em] uppercase">Connect_Repository</p>
            <div className="space-y-3">
              <div className="relative group">
                <GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 h-3.5 w-3.5 group-focus-within:text-white/60 transition-colors" />
                <input
                  placeholder="https://github.com/org-name"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 h-10 pl-10 pr-4 text-[10px] tracking-widest font-bold uppercase text-white rounded-lg focus:ring-1 focus:ring-white/20 placeholder:text-white/20 transition-all focus:bg-white/[0.05]"
                />
              </div>
              <Button 
                onClick={handleConnectGithub}
                disabled={isConnectingGithub || !githubUrl}
                className="w-full bg-white text-background label-sm h-10 rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
              >
                {isConnectingGithub ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                {isConnectingGithub ? "SYNCING..." : "CONNECT_GITHUB"}
              </Button>
            </div>

            {isConnectingGithub && syncStatus && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-white/40" />
                  <span className="text-[9px] font-black text-white/40 tracking-widest uppercase">{syncStatus}</span>
                </div>
                <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="h-full bg-white/40"
                  />
                </div>
              </div>
            )}

            {connectedOrg && !isConnectingGithub && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {connectedOrg.name}
                    </span>
                    <Badge variant="outline" className="text-[8px] font-black bg-white/10 border-white/20">
                      {orgRepos.length} REPOS
                    </Badge>
                  </div>
                  {connectedOrg.description && (
                    <p className="text-[9px] text-white/40 leading-relaxed">{connectedOrg.description}</p>
                  )}
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-white/40" />
                    <span className="text-[9px] text-white/30 font-mono uppercase tracking-widest">Knowledge graph updated</span>
                  </div>
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto no-scrollbar">
                  {orgRepos.map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        <GitBranch className="h-2.5 w-2.5 text-white/20 shrink-0" />
                        <span className="text-[9px] text-white/50 truncate font-mono">{r.name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {r.language && <span className="text-[8px] text-white/20 font-mono">{r.language}</span>}
                        {r.isArchived && <span className="text-[7px] text-white/20 uppercase">archived</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          <div className="glass-panel border border-white/5 p-6 rounded-[2rem] tonal-shift space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-white/40" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Network_Stats</span>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[9px] font-bold text-white/20 mb-1 uppercase tracking-widest">Neural_Throughput</div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "78%" }} className="h-full bg-white/40" />
                </div>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-white/40">LATENCY</span>
                <span className="text-sm font-mono text-white">12ms</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Sync Feed */}
        <ScrollArea className="flex-1 no-scrollbar bg-white/[0.01]">
          <div className="max-w-4xl mx-auto p-12">
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-[27px] top-0 bottom-0 w-px bg-white/5" />

              {filteredSyncs.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                    <Activity className="h-10 w-10 text-white/10 mb-6" />
                    <p className="label-sm text-white/20 tracking-[0.3em]">NO_SYNC_HISTORY</p>
                    <p className="text-xs text-white/20 mt-2">Connect sources in Feed Sources to begin ingesting data.</p>
                  </div>
                )}
              <div className="space-y-12">
                {filteredSyncs.map((sync, index) => {
                  const config = SOURCE_CONFIG[sync.source] ?? SOURCE_CONFIG.manual;
                  const Icon = config.icon;

                  return (
                    <motion.div 
                      key={sync.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group relative flex gap-10 items-start"
                    >
                      {/* Source Indicator */}
                      <div className={cn(
                        "relative z-10 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border transition-all duration-500",
                        sync.status === "syncing" 
                          ? "bg-white border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                          : "bg-surface-low border-white/10 group-hover:border-white/20 group-hover:bg-white/[0.03]"
                      )}>
                        {sync.status === "syncing" ? (
                          <Loader2 className="h-6 w-6 animate-spin text-background" />
                        ) : (
                          <Icon className={cn("h-6 w-6 transition-colors", sync.status === "completed" ? "text-white/40 group-hover:text-white" : "")} />
                        )}
                        
                        {sync.alert && sync.status === "completed" && (
                          <div className="absolute -top-1 -right-1 h-3 w-3 bg-white rounded-full shadow-[0_0_10px_white] animate-pulse" />
                        )}
                      </div>

                      {/* Content Card */}
                      <div className={cn(
                        "flex-1 glass-panel p-8 rounded-[2rem] border transition-all duration-500 tonal-shift relative overflow-hidden",
                        sync.status === "syncing" ? "border-white/20 bg-white/[0.05]" : "border-white/5 hover:border-white/10"
                      )}>
                        {sync.status === "syncing" && (
                          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                        )}
                        
                        <div className="flex items-start justify-between mb-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-white/20 tracking-[0.2em] uppercase">{config.label}</span>
                              <div className="h-1 w-1 rounded-full bg-white/10" />
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40">
                                <Clock className="h-3 w-3" />
                                {sync.timestamp}
                              </div>
                            </div>
                            <h3 className={cn(
                              "text-lg font-bold tracking-tight transition-colors",
                              sync.status === "syncing" ? "text-white animate-pulse" : "text-white/80 group-hover:text-white"
                            )}>
                              {sync.title}
                            </h3>
                          </div>
                          <Badge variant="outline" className={cn(
                            "instrument-border text-[9px] px-2 py-0.5 uppercase tracking-widest font-black",
                            sync.status === "syncing" ? "bg-white text-background border-white" : "text-white/20"
                          )}>
                            {sync.status}
                          </Badge>
                        </div>

                        <p className="text-sm text-white/60 leading-relaxed font-medium mb-8">
                          {sync.description}
                        </p>
                        
                        {sync.impact && sync.impact.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-6 border-t border-white/5">
                            {sync.impact.map((page: string) => (
                              <button
                                key={page}
                                className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-[10px] font-black tracking-widest text-white/40 hover:bg-white/5 hover:text-white transition-all uppercase"
                              >
                                {page}
                                <ArrowUpRight className="h-3 w-3" />
                              </button>
                            ))}
                          </div>
                        )}

                        {sync.alert && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4"
                          >
                            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                              <AlertTriangle className="h-4 w-4 text-background" />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-black text-white uppercase tracking-widest">Conflict_Alert</p>
                              <p className="text-xs text-white/60 font-medium">Procedural drift detected in engineering-vault.md</p>
                            </div>
                            <Button variant="ghost" className="text-[9px] font-black uppercase text-white/20 hover:text-white">
                              RESOLVE
                            </Button>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
