"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Globe,
  MessageSquare,
  Database,
  Image,
  Link2,
  FileText,
  Mic,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Zap,
  Loader2,
  Shield,
  Key,
  Server,
  Workflow,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useNeuralStore } from "@/lib/store";
import { SOURCE_SEEDS } from "@/lib/neural-seed";

import { toast } from "sonner";

const APP_CONFIGS: Record<string, { icon: any; color: string; steps: string[] }> = {
  NOTION: {
    icon: Database,
    color: "text-[#000000]",
    steps: [
      "ESTABLISHING_OAUTH_SESSION...",
      "FETCHING_WORKSPACE_HIERARCHY...",
      "QUERYING_DATABASES_AND_PAGES...",
      "MAPPING_BLOCK_STRUCTURES...",
      "SYNCING_KNOWLEDGE_GRAPHS...",
    ],
  },
  "GOOGLE DRIVE": {
    icon: FileText,
    color: "text-[#4285F4]",
    steps: [
      "AUTHORIZING_VIA_GOOGLE_CLOUD...",
      "SCANNING_ROOT_DIRECTORIES...",
      "INDEXING_DOCUMENT_METADATA...",
      "PREPARING_VECTOR_EMBEDDINGS...",
      "CONTINUOUS_POLLING_ACTIVE...",
    ],
  },
  CONFLUENCE: {
    icon: FileText,
    color: "text-[#0052CC]",
    steps: [
      "CONNECTING_TO_ATLASSIAN_API...",
      "RETRIEVING_SPACE_PERMISSIONS...",
      "CACHING_PAGE_HIERARCHY...",
      "IDENTIFYING_MACRO_CONTENT...",
      "INTEGRITY_SYNC_COMPLETE...",
    ],
  },
  LINEAR: {
    icon: Workflow,
    color: "text-[#5E6AD2]",
    steps: [
      "HANDSHAKING_WITH_LINEAR_GRAPHQL...",
      "FETCHING_TEAM_WORKFLOWS...",
      "SYNCING_ISSUES_AND_CYCLES...",
      "MAPPING_PROJECT_RELATIONS...",
      "REAL_TIME_WEBHOOK_ACTIVE...",
    ],
  },
  INTERCOM: {
    icon: MessageSquare,
    color: "text-[#0057FF]",
    steps: [
      "ACCESSING_INTERCOM_WORKSPACE...",
      "STREAMING_CONVERSATION_LOGS...",
      "IDENTIFYING_CUSTOMER_SEGMENTS...",
      "EXTRACTING_INTENT_PATTERNS...",
      "DATA_PIPELINE_SYNCHRONIZED...",
    ],
  },
  GITHUB: {
    icon: Link2,
    color: "text-[#24292F]",
    steps: [
      "AUTHENTICATING_GITHUB_APP...",
      "LISTING_ACCESSIBLE_REPOS...",
      "INDEXING_READMES_AND_DOCS...",
      "ANALYZING_COMMIT_HISTORY...",
      "SOURCE_CONTROL_SYNCED...",
    ],
  },
  JIRA: {
    icon: Workflow,
    color: "text-[#0052CC]",
    steps: [
      "HANDSHAKING_ATLASSIAN_CLOUD...",
      "MAPPING_PROJECT_SCHEMAS...",
      "FETCHING_TICKETS_AND_SPRINTS...",
      "ANALYZING_VELOCITY_DATA...",
      "AGILE_METRICS_SYNCED...",
    ],
  },
  LOOM: {
    icon: Image,
    color: "text-[#625DF5]",
    steps: [
      "CONNECTING_LOOM_SDK...",
      "FETCHING_VIDEO_TRANSCRIPTS...",
      "INDEXING_VISUAL_CONTEXT...",
      "MAPPING_TEAM_FOLDERS...",
      "VIDEO_INTELLIGENCE_READY...",
    ],
  },
};

export default function FeedPage() {
  const [url, setUrl] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isIngesting, setIsIngesting] = useState(false);
  const { connectedApps, connectApp, addSyncLog, addSops, liveNodes } = useNeuralStore();
  const [connectingApp, setConnectingApp] = useState<string | null>(null);
  const [connectionStep, setConnectionStep] = useState(0);

  const handleConnect = (appName: string) => {
    if (connectedApps.includes(appName)) return;
    setConnectingApp(appName);
    setConnectionStep(0);
  };

  useEffect(() => {
    if (connectingApp) {
      const steps = APP_CONFIGS[connectingApp].steps;
      const interval = setInterval(() => {
        setConnectionStep((prev) => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            setTimeout(() => {
              // Mark app as connected in neural store
              connectApp(connectingApp);
              // Stage this source's data into the store (pending until INITIALIZE_SYNC)
              const seed = SOURCE_SEEDS[connectingApp];
              if (seed) {
                // Stage nodes/links as pending in store
                useNeuralStore.setState((s) => ({
                  pendingNodes: [
                    ...s.pendingNodes,
                    ...seed.nodes.filter((n) => !s.liveNodes.find((ln) => ln.id === n.id) && !s.pendingNodes.find((pn) => pn.id === n.id)),
                  ],
                  pendingLinks: [
                    ...s.pendingLinks,
                    ...seed.links.filter(
                      (l) => !s.liveLinks.find((ll) => ll.source === l.source && ll.target === l.target)
                    ),
                  ],
                }));
                addSyncLog(seed.syncLog);
                addSops(seed.sops);
              }
              setConnectingApp(null);
              setConnectionStep(0);
            }, 1000);
            return prev;
          }
          return prev + 1;
        });
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [connectingApp, connectApp, addSyncLog, addSops]);

  const handleIngest = async () => {
    if (uploadedFiles.length === 0) return;
    setIsIngesting(true);

    const newNodes: any[] = [];
    for (const file of uploadedFiles) {
      const timestamp = new Date().toISOString();
      let textPreview = "";
      
      try {
        if (file.type.includes("text") || file.name.endsWith(".md") || file.name.endsWith(".txt")) {
          textPreview = (await file.text()).slice(0, 2000);
        }
      } catch (e) {}

      // Call API to get high-fidelity extraction from Groq
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          type: file.type || "unknown",
          size: `${(file.size / 1024).toFixed(1)} KB`,
          textPreview,
        }),
      });
      const { extraction } = await res.json();

      const metadata = {
        filename: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
        ingestedAt: timestamp,
        status: "vectorized",
        engine: "Groq-llama-3.3-70b",
      };

      newNodes.push({
        id: `doc-${file.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`,
        label: file.name,
        type: "source" as const,
        source: "INTERNAL",
        val: 2,
        content: `DOCUMENT_TRACE: ${file.name}\nMETADATA: ${JSON.stringify(metadata, null, 2)}\n\nEXTRACTED_CONTENT:\n${extraction}`,
      });
    }

    // Add nodes to store
    useNeuralStore.setState((s) => ({
      liveNodes: [...s.liveNodes, ...newNodes],
      connectedApps: s.connectedApps.includes("INTERNAL") ? s.connectedApps : [...s.connectedApps, "INTERNAL"],
    }));

    // Add a sync log
    addSyncLog({
      id: `sync-doc-${Date.now()}`,
      source: "INTERNAL",
      timestamp: "JUST NOW",
      title: `Ingestion: ${uploadedFiles.length} Documents`,
      description: `Processed and vectorized ${uploadedFiles.length} assets. High-fidelity extraction complete.`,
      impact: uploadedFiles.map(f => f.name),
      status: "completed",
    });

    setIsIngesting(false);
    setUploadedFiles([]);
    toast.success("DOCUMENTS_INGESTED", {
      description: `${newNodes.length} files successfully integrated into knowledge base.`,
      className: "glass-panel border-white/10 text-white rounded-xl uppercase tracking-widest text-[10px] font-black"
    });
  };

  const onDrop = useCallback((accepted: File[]) => {
    setUploadedFiles((prev) => [...prev, ...accepted]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/markdown": [".md"],
      "text/plain": [".txt"],
      "application/pdf": [".pdf"],
      "text/csv": [".csv"],
      "text/html": [".html"],
    },
  });

  return (
    <div className="flex h-screen flex-col bg-background antialiased">
      <header className="flex h-16 items-center justify-between border-b border-white/5 px-8 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold tracking-tight text-white uppercase">Feed Sources</span>
          <div className="hidden md:flex h-8 w-[1px] bg-white/10 mx-2"></div>
          <Badge variant="outline" className="instrument-border text-white/40 label-sm">
            INPUT PIPELINES NOMINAL
          </Badge>
        </div>
      </header>

      <div className="flex-1 overflow-auto no-scrollbar p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-surface-low border border-white/5 p-1">
              {[
                { value: "documents", label: "DOCUMENTS", icon: FileText },
                { value: "connectors", label: "APP CONNECTORS", icon: Workflow },
              ].map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value} 
                  className="label-sm gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="documents" className="mt-8 animate-in fade-in duration-300">
              <div
                {...getRootProps()}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border border-dashed p-20 transition-all cursor-pointer bg-white/[0.02]",
                  isDragActive
                    ? "border-white bg-white/5 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                    : "border-white/10 hover:border-white/30 hover:bg-white/[0.04]"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-white/20 mb-6" />
                <h3 className="label-sm text-white text-lg tracking-wider mb-2">TRANSFER KNOWLEDGE ASSETS</h3>
                <p className="text-sm text-white/40 font-medium mb-6">
                  PDF, Markdown, MS Word, Vectorized CSV, plaintext
                </p>
                <div className="px-6 py-2 rounded border border-white/5 bg-white/5 label-sm text-white/40 uppercase">
                  OR CLICK TO BROWSE LOCAL FILESYSTEM
                </div>
              </div>

              {uploadedFiles.length > 0 && (
                <div className="mt-8 space-y-3">
                  <h4 className="label-sm text-white/20 uppercase tracking-[0.2em] mb-4">PENDING INGESTION</h4>
                  {uploadedFiles.map((file, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-4 rounded border border-white/5 bg-white/5 p-4 tonal-shift group"
                    >
                      <FileText className="h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/60 font-medium truncate">{file.name}</p>
                        <p className="text-[9px] text-white/20 font-mono">{(file.size / 1024).toFixed(1)} KB · {file.type || "unknown type"}</p>
                      </div>
                      <div className="flex items-center gap-2 label-sm text-white/40">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        READY
                      </div>
                    </motion.div>
                  ))}
                  <Button 
                    onClick={handleIngest}
                    disabled={isIngesting}
                    className="w-full h-14 mt-4 bg-white text-background label-sm hover:opacity-90 disabled:opacity-50"
                  >
                    {isIngesting ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>PROCESSING_KNOWLEDGE_VECTORS...</span>
                      </div>
                    ) : (
                      "START INTEL INGESTION SYSTEM"
                    )}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="connectors" className="mt-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.keys(APP_CONFIGS).map((name) => {
                  const isConnected = connectedApps.includes(name);
                  const isConnecting = connectingApp === name;
                  return (
                    <button
                      key={name}
                      onClick={() => handleConnect(name)}
                      disabled={isConnecting}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-5 transition-all relative overflow-hidden group",
                        isConnected 
                          ? "bg-white/5 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.05)]" 
                          : "bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/20"
                      )}
                    >
                      {isConnected && (
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      )}
                      <div className="flex flex-col items-start gap-1">
                        <span className={cn(
                          "label-sm transition-colors",
                          isConnected ? "text-white" : "text-white/60 group-hover:text-white"
                        )}>{name}</span>
                        {isConnected && (
                          <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">ACTIVE_SYNC</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 label-sm transition-colors">
                        {isConnected ? (
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        ) : isConnecting ? (
                          <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
                        ) : (
                          <div className="flex items-center gap-1 text-white/20 group-hover:text-white/40">
                            <Link2 className="h-3 w-3" />
                            <span className="text-[10px]">SYNC</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>

          <div className="h-20 invisible" />
        </div>
      </div>

      {/* Connection Overlay */}
      <AnimatePresence>
        {connectingApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="max-w-md w-full bg-surface-low border border-white/10 rounded-[2.5rem] p-10 space-y-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-[2px] bg-white/10 overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                />
              </div>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="h-20 w-20 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10">
                    {(() => {
                      const Icon = APP_CONFIGS[connectingApp].icon;
                      return <Icon className={cn("h-10 w-10", APP_CONFIGS[connectingApp].color)} />;
                    })()}
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    className="absolute -inset-4 border border-dashed border-white/10 rounded-full"
                  />
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-2xl">
                    <Shield className="h-4 w-4 text-background" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold tracking-tight text-white uppercase">Connecting {connectingApp}</h2>
                  <p className="text-xs text-white/40 font-black tracking-widest uppercase">ENCRYPTED_OAUTH_TUNNEL_ACTIVE</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  {APP_CONFIGS[connectingApp].steps.map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ 
                        opacity: i <= connectionStep ? 1 : 0.2,
                        x: 0,
                        filter: i === connectionStep ? "blur(0px)" : i < connectionStep ? "blur(0px)" : "blur(2px)"
                      }}
                      className="flex items-center gap-4"
                    >
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all duration-500",
                        i < connectionStep ? "bg-white" : i === connectionStep ? "bg-white animate-pulse shadow-[0_0_8px_white]" : "bg-white/10"
                      )} />
                      <span className={cn(
                        "text-[10px] font-black tracking-[0.15em] uppercase transition-all duration-500",
                        i === connectionStep ? "text-white" : "text-white/40"
                      )}>
                        {step}
                      </span>
                      {i < connectionStep && (
                        <CheckCircle2 className="h-3 w-3 text-white/40 ml-auto" />
                      )}
                      {i === connectionStep && (
                        <Loader2 className="h-3 w-3 text-white/40 animate-spin ml-auto" />
                      )}
                    </motion.div>
                  ))}
                </div>

                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((connectionStep + 1) / APP_CONFIGS[connectingApp].steps.length) * 100}%` }}
                    className="h-full bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-white/20" />
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">TLS_1.3_VERIFIED</span>
                </div>
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-white/20" />
                  <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">US-EAST-1_CLUSTER</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
