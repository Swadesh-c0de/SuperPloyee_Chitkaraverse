"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CompanyProfile,
  Mission,
  Department,
  UseCase,
  WikiStats,
  SignalEvent,
  GraphData,
} from "./types";
import type { SeedNode, SeedLink, SeedSyncLog, SeedSOP } from './neural-seed';

interface OnboardingStore {
  step: number;
  company: CompanyProfile;
  mission: Mission;
  departments: Department[];
  useCases: UseCase[];
  completed: boolean;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCompany: (company: Partial<CompanyProfile>) => void;
  setMission: (mission: Partial<Mission>) => void;
  setDepartments: (departments: Department[]) => void;
  toggleDepartment: (dept: Department) => void;
  setUseCases: (useCases: UseCase[]) => void;
  toggleUseCase: (useCase: UseCase) => void;
  setCompleted: (completed: boolean) => void;
  reset: () => void;
}

const defaultCompany: CompanyProfile = {
  name: "",
  industry: "",
  size: "",
  foundedYear: "",
  hqLocation: "",
};

const defaultMission: Mission = {
  oneLiner: "",
  customer: "",
  biggestProblem: "",
};

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      step: 0,
      company: defaultCompany,
      mission: defaultMission,
      departments: [],
      useCases: [],
      completed: false,
      setStep: (step) => set({ step }),
      nextStep: () => set((s) => ({ step: s.step + 1 })),
      prevStep: () => set((s) => ({ step: Math.max(0, s.step - 1) })),
      setCompany: (company) =>
        set((s) => ({ company: { ...s.company, ...company } })),
      setMission: (mission) =>
        set((s) => ({ mission: { ...s.mission, ...mission } })),
      setDepartments: (departments) => set({ departments }),
      toggleDepartment: (dept) =>
        set((s) => {
          const exists = s.departments.find((d) => d.id === dept.id);
          if (exists) {
            return { departments: s.departments.filter((d) => d.id !== dept.id) };
          }
          return { departments: [...s.departments, dept] };
        }),
      setUseCases: (useCases) => set({ useCases }),
      toggleUseCase: (useCase) =>
        set((s) => {
          if (s.useCases.includes(useCase)) {
            return { useCases: s.useCases.filter((u) => u !== useCase) };
          }
          if (s.useCases.length >= 3) return s;
          return { useCases: [...s.useCases, useCase] };
        }),
      setCompleted: (completed) => set({ completed }),
      reset: () =>
        set({
          step: 0,
          company: defaultCompany,
          mission: defaultMission,
          departments: [],
          useCases: [],
          completed: false,
        }),
    }),
    { name: "cortex-onboarding" }
  )
);

interface WikiStore {
  stats: WikiStats | null;
  graph: GraphData | null;
  signals: SignalEvent[];
  loading: boolean;
  setStats: (stats: WikiStats) => void;
  setGraph: (graph: GraphData) => void;
  addSignal: (signal: SignalEvent) => void;
  setLoading: (loading: boolean) => void;
}

export const useWikiStore = create<WikiStore>()((set) => ({
  stats: null,
  graph: null,
  signals: [],
  loading: false,
  setStats: (stats) => set({ stats }),
  setGraph: (graph) => set({ graph }),
  addSignal: (signal) =>
    set((s) => ({ signals: [signal, ...s.signals].slice(0, 50) })),
  setLoading: (loading) => set({ loading }),
}));

interface NeuralStore {
  // Apps that have completed the OAuth flow
  connectedApps: string[];
  // Nodes/links currently visible in the graph
  liveNodes: SeedNode[];
  liveLinks: SeedLink[];
  // Nodes/links waiting to be animated in on next sync
  pendingNodes: SeedNode[];
  pendingLinks: SeedLink[];
  // Sync logs visible in history
  syncLogs: SeedSyncLog[];
  // SOPs visible in SOP autopilot
  sops: SeedSOP[];
  // True while the sync animation is running
  isSyncing: boolean;

  connectApp: (appName: string) => void;
  isAppConnected: (appName: string) => boolean;
  hasPending: () => boolean;
  commitPending: (nodes: SeedNode[], links: SeedLink[]) => void;
  addSyncLog: (log: SeedSyncLog) => void;
  addSops: (sops: SeedSOP[]) => void;
  setIsSyncing: (v: boolean) => void;
  reset: () => void;
}

export const useNeuralStore = create<NeuralStore>()(
  persist(
    (set, get) => ({
      connectedApps: [],
      liveNodes: [],
      liveLinks: [],
      pendingNodes: [],
      pendingLinks: [],
      syncLogs: [],
      sops: [],
      isSyncing: false,

      connectApp: (appName) => {
        const name = appName.toUpperCase();
        if (get().connectedApps.includes(name)) return;
        set((s) => ({ connectedApps: [...s.connectedApps, name] }));
      },

      isAppConnected: (appName) =>
        get().connectedApps.includes(appName.toUpperCase()),

      hasPending: () => get().pendingNodes.length > 0,

      commitPending: (nodes, links) => {
        set((s) => ({
          liveNodes: [
            ...s.liveNodes,
            ...nodes.filter((n) => !s.liveNodes.find((ln) => ln.id === n.id)),
          ],
          liveLinks: [
            ...s.liveLinks,
            ...links.filter(
              (l) =>
                !s.liveLinks.find(
                  (ll) => ll.source === l.source && ll.target === l.target
                )
            ),
          ],
          pendingNodes: [],
          pendingLinks: [],
        }));
      },

      addSyncLog: (log) =>
        set((s) => ({
          syncLogs: [log, ...s.syncLogs].slice(0, 20),
        })),

      addSops: (sops) =>
        set((s) => ({
          sops: [
            ...s.sops,
            ...sops.filter((sop) => !s.sops.find((existing) => existing.id === sop.id)),
          ],
        })),

      setIsSyncing: (v) => set({ isSyncing: v }),

      reset: () =>
        set({
          connectedApps: [],
          liveNodes: [],
          liveLinks: [],
          pendingNodes: [],
          pendingLinks: [],
          syncLogs: [],
          sops: [],
          isSyncing: false,
        }),
    }),
    { name: "cortex-neural" }
  )
);

// Keep ConnectionStore as a thin alias for backward compat during transition
interface ConnectionStore {
  connectedApps: string[];
  connectApp: (appName: string) => void;
  isAppConnected: (appName: string) => boolean;
  reset: () => void;
}

export const useConnectionStore = create<ConnectionStore>()(
  persist(
    (set, get) => ({
      connectedApps: [],
      connectApp: (appName) => {
        const name = appName.toUpperCase();
        if (!get().connectedApps.includes(name)) {
          set((s) => ({ connectedApps: [...s.connectedApps, name] }));
        }
      },
      isAppConnected: (appName) => get().connectedApps.includes(appName.toUpperCase()),
      reset: () => set({ connectedApps: [] }),
    }),
    { name: "cortex-connections" }
  )
);

interface UIStore {
  sidebarCollapsed: boolean;
  activePanel: string | null;
  toggleSidebar: () => void;
  setActivePanel: (panel: string | null) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
  sidebarCollapsed: false,
  activePanel: null,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setActivePanel: (panel) => set({ activePanel: panel }),
}));

export interface PersistedChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  timestamp: number;
}

export interface PersistedRetrievedDoc {
  name: string;
  source: string;
  type: string;
  relevance: number;
}

interface ChatStore {
  messages: PersistedChatMessage[];
  traceHistory: PersistedRetrievedDoc[][];
  setMessages: (msgs: PersistedChatMessage[]) => void;
  addMessage: (msg: PersistedChatMessage) => void;
  updateMessage: (id: string, patch: Partial<PersistedChatMessage>) => void;
  appendTraceHistory: (docs: PersistedRetrievedDoc[]) => void;
  clear: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      traceHistory: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
      updateMessage: (id, patch) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        })),
      appendTraceHistory: (docs) =>
        set((s) => ({ traceHistory: [...s.traceHistory, docs] })),
      clear: () => set({ messages: [], traceHistory: [] }),
    }),
    { name: "cortex-chat" }
  )
);
