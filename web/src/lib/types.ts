export interface CompanyProfile {
  name: string;
  industry: string;
  size: string;
  foundedYear: string;
  hqLocation: string;
  logoUrl?: string;
  description?: string;
}

export interface Mission {
  oneLiner: string;
  customer: string;
  biggestProblem: string;
}

export interface Department {
  id: string;
  name: string;
  color: string;
  headCount?: number;
}

export type UseCase =
  | "automate-processes"
  | "better-decisions"
  | "customer-intelligence"
  | "competitive-analysis"
  | "onboarding-knowledge"
  | "investor-reporting";

export interface OnboardingState {
  step: number;
  company: CompanyProfile;
  mission: Mission;
  departments: Department[];
  useCases: UseCase[];
  completed: boolean;
}

export interface WikiPageNode {
  id: string;
  title: string;
  type: string;
  filePath: string;
  tags: string[];
  updated: string;
  department?: string;
}

export interface WikiLink {
  source: string;
  target: string;
  strength: number;
}

export interface GraphData {
  nodes: WikiPageNode[];
  links: WikiLink[];
}


export interface SignalEvent {
  id: string;
  timestamp: string;
  type: "ingest" | "update" | "contradiction" | "query" | "lint";
  title: string;
  description: string;
  pagesAffected: string[];
}

export interface WikiStats {
  totalPages: number;
  pagesByType: Record<string, number>;
  totalLinks: number;
  brokenLinks: number;
  rawSources: number;
  ingestedSources: number;
  recentlyUpdated: Array<{ title: string; updated: string }>;
}

export interface LintIssue {
  severity: "error" | "warning" | "suggestion";
  file: string;
  message: string;
}

export interface QueryResult {
  answer: string;
  pagesConsulted: string[];
  confidence: number;
  gaps: string[];
}
