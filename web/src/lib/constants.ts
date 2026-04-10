export const DEPARTMENT_COLORS: Record<string, string> = {
  sales: "rgba(255,255,255,0.4)",
  product: "rgba(255,255,255,0.3)",
  support: "rgba(255,255,255,0.2)",
  engineering: "rgba(255,255,255,0.5)",
  hr: "rgba(255,255,255,0.15)",
  finance: "rgba(255,255,255,0.25)",
  marketing: "rgba(255,255,255,0.35)",
  operations: "rgba(255,255,255,0.45)",
  legal: "rgba(255,255,255,0.1)",
  design: "rgba(255,255,255,0.55)",
};

export const DEPARTMENT_PRESETS = [
  { id: "sales", name: "Sales", color: DEPARTMENT_COLORS.sales },
  { id: "product", name: "Product", color: DEPARTMENT_COLORS.product },
  { id: "support", name: "Support", color: DEPARTMENT_COLORS.support },
  { id: "engineering", name: "Engineering", color: DEPARTMENT_COLORS.engineering },
  { id: "hr", name: "HR & People", color: DEPARTMENT_COLORS.hr },
  { id: "finance", name: "Finance", color: DEPARTMENT_COLORS.finance },
  { id: "marketing", name: "Marketing", color: DEPARTMENT_COLORS.marketing },
  { id: "operations", name: "Operations", color: DEPARTMENT_COLORS.operations },
  { id: "legal", name: "Legal", color: DEPARTMENT_COLORS.legal },
  { id: "design", name: "Design", color: DEPARTMENT_COLORS.design },
];

export const USE_CASE_OPTIONS = [
  { id: "automate-processes" as const, icon: "🔄", label: "Automate Internal Processes", description: "Streamline workflows, SOPs, and repetitive tasks" },
  { id: "better-decisions" as const, icon: "⚡", label: "Better Business Decisions", description: "Evidence-backed briefs from your own data" },
  { id: "customer-intelligence" as const, icon: "🎯", label: "Customer Intelligence", description: "Surface patterns from support tickets and sales calls" },
  { id: "competitive-analysis" as const, icon: "🕵️", label: "Competitive Analysis", description: "Track competitors and market positioning" },
  { id: "onboarding-knowledge" as const, icon: "🧑‍💼", label: "Employee Onboarding & Knowledge Transfer", description: "Ramp new hires 3x faster with an AI copilot" },
  { id: "investor-reporting" as const, icon: "📊", label: "Investor / Board Reporting", description: "Generate board-ready reports from company data" },
];

export const PAGE_TYPE_COLORS: Record<string, string> = {
  source: "#3b82f6",
  entity: "#8b5cf6",
  concept: "#10b981",
  project: "#f97316",
  decision: "#eab308",
  analysis: "#ec4899",
};

export const COMPANY_SIZE_OPTIONS = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
];
