export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  priority: "critical" | "high" | "medium";
  source: string;
  tasks: string[];
}

export interface RoadmapPhase {
  id: string;
  label: string;
  duration: string;
  objective: string;
  milestones: RoadmapMilestone[];
}

export interface RoadmapData {
  title: string;
  subtitle: string;
  summary: string;
  phases: RoadmapPhase[];
  keyContacts: { role: string; purpose: string }[];
  successMetrics: string[];
  redFlags: string[];
}

export interface SavedRoadmap {
  id: string;
  mode: "client" | "employee";
  createdAt: string;
  roadmap: RoadmapData;
}

const STORAGE_KEY = "cortex_roadmaps";

export function generateId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function loadRoadmaps(): SavedRoadmap[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedRoadmap[];
  } catch {
    return [];
  }
}

export function saveRoadmap(entry: SavedRoadmap): void {
  if (typeof window === "undefined") return;
  const existing = loadRoadmaps();
  const updated = [entry, ...existing.filter(r => r.id !== entry.id)].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getRoadmapById(id: string): SavedRoadmap | null {
  return loadRoadmaps().find(r => r.id === id) ?? null;
}

export function deleteRoadmap(id: string): void {
  if (typeof window === "undefined") return;
  const updated = loadRoadmaps().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

// ── SOP persistence ─────────────────────────────────────────────────────────

export interface SavedSOP {
  id: string;
  intent: string;
  category: string;
  createdAt: string;
  sop: Record<string, unknown>;
}

const SOP_STORAGE_KEY = "cortex_sops";

export function loadSOPs(): SavedSOP[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SOP_STORAGE_KEY) ?? "[]") as SavedSOP[];
  } catch {
    return [];
  }
}

export function saveSOP(entry: SavedSOP): void {
  if (typeof window === "undefined") return;
  const existing = loadSOPs();
  const updated = [entry, ...existing.filter(s => s.id !== entry.id)].slice(0, 30);
  localStorage.setItem(SOP_STORAGE_KEY, JSON.stringify(updated));
}

export function getSOPById(id: string): SavedSOP | null {
  return loadSOPs().find(s => s.id === id) ?? null;
}
