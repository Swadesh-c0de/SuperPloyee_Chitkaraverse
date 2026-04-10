// Per-source seed data. Each source has nodes, links between those nodes,
// a sync log entry, and SOPs that get unlocked when the source is connected.

export interface SeedNode {
  id: string;
  label: string;
  type: "source" | "entity" | "concept" | "project" | "decision" | "analysis";
  source: string;
  val?: number;
  content?: string;
}

export interface SeedLink {
  source: string;
  target: string;
}

export interface SeedSyncLog {
  id: string;
  source: string;
  timestamp: string;
  title: string;
  description: string;
  impact: string[];
  status: "completed" | "syncing";
  alert?: boolean;
}

export interface SeedSOP {
  id: string;
  title: string;
  department: string;
  status: "current" | "outdated";
  lastUpdated: string;
  staleSteps: number;
  totalSteps: number;
  steps: {
    text: string;
    current: boolean;
    source: string;
    staleNote?: string;
  }[];
}

export interface SourceSeed {
  nodes: SeedNode[];
  links: SeedLink[];
  syncLog: SeedSyncLog;
  sops: SeedSOP[];
}

export const SOURCE_SEEDS: Record<string, SourceSeed> = {
  NOTION: {
    nodes: [
      {
        id: "notion-root", label: "Notion Workspace", type: "entity", source: "NOTION", val: 4,
        content: "Central Notion workspace for Superloyee. Contains 3 active databases: Product, HR, and Engineering. 47 pages total, last synced today. Owned by the Founders.",
      },
      {
        id: "notion-roadmap", label: "Product Roadmap Q4", type: "project", source: "NOTION",
        content: "Q4 2024 Product Roadmap. Three pillars: (1) Meeting Brain — bot joins calls, live transcript, post-meeting AI summary. Target: GA by Nov 30. (2) SOP Autopilot — automated drift detection for stale procedures. Target: Beta Oct 15. (3) Neural Ingestion v2 — Groq-powered PDF and doc extraction with 95%+ accuracy. Status: In progress. Key decisions: Ship post-meeting analysis before live transcript. Bundle Meeting Brain into Pro tier. Deprioritize mobile SDK until Q1. Owner: Aryan (Head of Product).",
      },
      {
        id: "notion-brand", label: "Brand Guidelines", type: "source", source: "NOTION",
        content: "Superloyee Brand Guidelines v2.1. Primary font: Instrument Sans. Secondary: JetBrains Mono for code/data. Color palette: Background #0a0a0a (near black), surface white/5 overlays, accent pure white. Voice: technical but human, never corporate. Tagline: 'Ambient intelligence for your company.' Logo usage: wordmark only in white on dark, no color variants. Do not use gradients in product UI. Spacing unit: 4px grid. Border radius: 12–24px for cards, 8px for inputs.",
      },
      {
        id: "notion-security", label: "Security Policies", type: "source", source: "NOTION",
        content: "Superloyee Security Policy v1.4. Data residency: all customer data stored in AWS us-east-1 by default, EU option available. Encryption: AES-256 at rest, TLS 1.3 in transit. Access control: RBAC with least-privilege. API keys rotate every 90 days. Secrets stored in AWS Secrets Manager — never in code or env files. SOC 2 Type II audit scheduled for Q1 2025. Penetration test completed Sept 2024 — 0 critical findings, 2 medium resolved. Employee access reviewed quarterly. All engineers must complete security training within 30 days of hire.",
      },
      {
        id: "notion-onboarding", label: "Employee Handbook", type: "source", source: "NOTION",
        content: "Superloyee Employee Handbook v3. Team size: 8 full-time, 3 contractors. Work style: async-first, overlap hours 10am–2pm IST. Tools: Notion (docs), Slack (comms), Jira (tickets), GitHub (code), Figma (design). PTO: unlimited with minimum 15 days/year. Compensation: reviewed biannually. Performance: quarterly OKRs reviewed with manager. All-hands: every Monday 10am IST. Engineering standups: daily async in #standup Slack. New hires get a 30-60-90 day plan on their first day. Hardware budget: $2,500 for setup. Learning budget: $1,000/year.",
      },
      {
        id: "notion-pricing", label: "Pricing Strategy Doc", type: "decision", source: "NOTION",
        content: "Superloyee Pricing Strategy (Internal). Free tier: 1 connected source, 100 queries/month, no Meeting Brain. Pro tier ($49/month): unlimited sources, unlimited queries, Meeting Brain included, SOP Autopilot, 5 team seats. Enterprise (custom): SSO, audit logs, custom data residency, dedicated support, unlimited seats. Decision: Meeting Brain is bundled in Pro, not a separate add-on. Rationale: increases LTV and reduces friction. Competitor reference: Guru ($15/seat), Tettra ($12/seat) — we differentiate on real-time intelligence, not static wiki.",
      },
    ],
    links: [
      { source: "notion-root", target: "notion-roadmap" },
      { source: "notion-root", target: "notion-brand" },
      { source: "notion-root", target: "notion-security" },
      { source: "notion-root", target: "notion-onboarding" },
      { source: "notion-root", target: "notion-pricing" },
    ],
    syncLog: {
      id: "sync-notion-1",
      source: "notion",
      timestamp: "JUST NOW",
      title: "Sync: Notion Workspace",
      description: "Ingested 6 pages across 3 databases. Product Roadmap Q4, Security Policies, and Pricing Strategy cross-linked to 4 existing graph nodes. 1 stale SOP step flagged in Employee Handbook.",
      impact: ["Product Roadmap Q4", "Security Policies", "Employee Handbook", "Pricing Strategy"],
      status: "completed",
    },
    sops: [
      {
        id: "sop-notion-1",
        title: "Security Incident Response",
        department: "Engineering",
        status: "current",
        lastUpdated: "JUST NOW",
        staleSteps: 0,
        totalSteps: 6,
        steps: [
          { text: "Identify and classify the incident (P0/P1/P2) within 15 minutes of detection", current: true, source: "Notion / Security Policies" },
          { text: "Isolate affected service or subnet — revoke tokens if auth-related", current: true, source: "Notion / Security Policies" },
          { text: "Snapshot affected database and lock write access during investigation", current: true, source: "Notion / Security Policies" },
          { text: "Notify CTO and legal counsel via encrypted Slack DM within 30 minutes", current: true, source: "Notion / Security Policies" },
          { text: "Conduct root cause analysis — review recent commits, infra changes, and access logs", current: true, source: "Notion / Security Policies" },
          { text: "Patch, redeploy, update firewall rules, rotate affected secrets, and document in post-mortem", current: true, source: "Notion / Security Policies" },
        ],
      },
      {
        id: "sop-notion-2",
        title: "Product Feature Launch Checklist",
        department: "Product",
        status: "current",
        lastUpdated: "JUST NOW",
        staleSteps: 0,
        totalSteps: 7,
        steps: [
          { text: "Write feature spec in Notion with problem statement, success metrics, and scope", current: true, source: "Notion / Product Roadmap Q4" },
          { text: "Get sign-off from CTO and CEO before engineering begins", current: true, source: "Notion / Product Roadmap Q4" },
          { text: "Create Jira epic and break into sub-tasks with story points", current: true, source: "Jira / Sprint Board" },
          { text: "Build behind feature flag — merge to main but keep hidden in prod", current: true, source: "GitHub / Feature Flags Doc" },
          { text: "Internal dog-food for minimum 5 business days before external release", current: true, source: "Notion / Product Roadmap Q4" },
          { text: "Update changelog, help docs, and notify customer success team", current: true, source: "Notion / Product Roadmap Q4" },
          { text: "Monitor error rates and latency for 48h post-launch, rollback if p95 > 200ms", current: true, source: "Notion / Security Policies" },
        ],
      },
    ],
  },

  GITHUB: {
    nodes: [
      {
        id: "github-root", label: "GitHub Org", type: "entity", source: "GITHUB", val: 4,
        content: "Superloyee GitHub organization. 4 active repositories: cortex-core (main product), infra-terraform (AWS infrastructure), design-system (shared UI components), internal-tools (scripts and automation). 3 engineers with write access. Branch protection enabled on main across all repos. Dependabot enabled. GitHub Actions CI runs on every PR.",
      },
      {
        id: "github-cortex-core", label: "repo/cortex-core", type: "source", source: "GITHUB",
        content: "cortex-core: Main Superloyee application. Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS, Zustand, Framer Motion, Groq SDK, Zustand persist. Key features: Neural Knowledge Graph, Query Console, Meeting Brain, SOP Autopilot, Feed Sources. 847 commits. Last commit: 'feat: add word-by-word transcript streaming in Meeting Brain'. CI: Biome lint + TypeScript check + Next.js build. Deploy: Vercel production on merge to main. 14 open PRs, 3 in review.",
      },
      {
        id: "github-infra", label: "repo/infra-terraform", type: "source", source: "GITHUB",
        content: "infra-terraform: AWS infrastructure as code using Terraform. Manages: ECS clusters for API services, RDS PostgreSQL (db.t3.medium), S3 buckets for document storage, CloudFront CDN, Route 53 DNS, ACM certificates, VPC with private subnets, IAM roles. Region: us-east-1 primary, eu-west-1 for EU customers. State stored in S3 with DynamoDB locking. Last change: increased ECS task CPU from 512 to 1024 for ingestion workers.",
      },
      {
        id: "github-design-system", label: "repo/design-system", type: "source", source: "GITHUB",
        content: "design-system: Shared component library built with shadcn/ui, Radix UI primitives, and Tailwind. Exported as npm package @superloyee/ui. Components: Button, Badge, Card, Dialog, Input, ScrollArea, Tabs, Toast. Design tokens aligned with brand guidelines — all dark-mode first. Storybook deployed at design.superloyee.com. Version: 0.4.2.",
      },
      {
        id: "github-adr-pinecone", label: "ADR: Pinecone over Weaviate", type: "decision", source: "GITHUB",
        content: "ADR-003: Vector Database Selection — Pinecone over Weaviate. Date: Sept 12, 2024. Decision: Use Pinecone for vector storage. Rationale: Pinecone offers managed infrastructure with no operational overhead, 99.99% SLA, and sub-10ms query latency at our scale. Weaviate requires self-hosting which adds DevOps burden. Alternatives considered: Chroma (too early stage), Qdrant (viable but less mature managed offering), pgvector (insufficient performance for >1M vectors). Consequences: Vendor dependency on Pinecone, ~$200/month cost at current scale. Revisit if costs exceed $2k/month.",
      },
      {
        id: "github-adr-monorepo", label: "ADR: Monorepo Strategy", type: "decision", source: "GITHUB",
        content: "ADR-001: Monorepo vs Polyrepo — Decision: Polyrepo. Date: June 3, 2024. Rationale: Team is small (3 engineers), polyrepo gives cleaner separation of concerns and simpler CI pipelines per service. Monorepo tooling (Turborepo/Nx) adds complexity not justified at current scale. Revisit when team grows to >8 engineers or when shared code exceeds 20% of codebase. Current shared code (~5%) is managed via the design-system npm package.",
      },
    ],
    links: [
      { source: "github-root", target: "github-cortex-core" },
      { source: "github-root", target: "github-infra" },
      { source: "github-root", target: "github-design-system" },
      { source: "github-cortex-core", target: "github-adr-pinecone" },
      { source: "github-infra", target: "github-adr-monorepo" },
    ],
    syncLog: {
      id: "sync-github-1",
      source: "github",
      timestamp: "JUST NOW",
      title: "Sync: GitHub Repositories",
      description: "Indexed 4 repos. Extracted 2 ADRs, 847 total commits, 14 open PRs. cortex-core linked to Jira epic ML Pipeline v2. Infra change detected: ECS CPU increase may affect cost model.",
      impact: ["repo/cortex-core", "ADR: Pinecone over Weaviate", "infra-terraform", "design-system"],
      status: "completed",
    },
    sops: [
      {
        id: "sop-github-1",
        title: "Code Review & Deploy Process",
        department: "Engineering",
        status: "current",
        lastUpdated: "JUST NOW",
        staleSteps: 0,
        totalSteps: 6,
        steps: [
          { text: "Create feature branch from main using format: feat/JIRA-XXX-short-description", current: true, source: "GitHub / CONTRIBUTING.md" },
          { text: "Open PR with description linking the Jira ticket, screenshots/recordings for UI changes", current: true, source: "GitHub / PR Template" },
          { text: "Require 2 approvals from CODEOWNERS — at least 1 must be a senior engineer", current: true, source: "GitHub / CODEOWNERS" },
          { text: "All CI checks must pass: Biome lint, TypeScript, Next.js build, and unit tests", current: true, source: "GitHub Actions / ci.yml" },
          { text: "Squash-merge into main and delete the feature branch immediately after merge", current: true, source: "GitHub / Branch Policy" },
          { text: "Verify Vercel preview deployment on staging URL before marking Jira ticket as Done", current: true, source: "GitHub / Deploy Policy" },
        ],
      },
    ],
  },

  JIRA: {
    nodes: [
      {
        id: "jira-root", label: "Jira Projects", type: "entity", source: "JIRA", val: 4,
        content: "Superloyee Jira workspace. 2 active projects: Project Phoenix (core product, 42 tickets) and ML Pipeline v2 (AI/infra, 18 tickets). Sprint cadence: 2 weeks. Current sprint: Sprint 42. Velocity: 34 story points/sprint average. 3 P0/P1 bugs open. Board leads: Aryan (Product), Dev Team (Engineering).",
      },
      {
        id: "jira-phoenix", label: "Project Phoenix", type: "project", source: "JIRA",
        content: "Project Phoenix: Core product development project. Goal: ship Superloyee v1.0 by Dec 31, 2024. Current sprint focus: Meeting Brain GA, SOP Autopilot beta. 42 open tickets: 8 bugs (1 P0, 2 P1, 5 P2), 18 features, 12 chores, 4 spikes. Velocity trend: improving — 28 → 34 → 38 points over last 3 sprints. 3 engineers active. Definition of done: code reviewed, tested, deployed to staging, and verified by PM.",
      },
      {
        id: "jira-sprint", label: "Sprint 42 — APAC Expansion", type: "project", source: "JIRA",
        content: "Sprint 42 (Oct 14 – Oct 28, 2024). Theme: APAC Expansion readiness. Committed: 36 story points. Completed so far: 22 points. Key tickets: PHX-142 (SSO provider support — 8pts, in review), PHX-148 (Multi-region data residency — 13pts, in progress), PHX-151 (Localization support for JP/KR — 5pts, blocked). Blockers: PHX-151 blocked by missing translation vendor contract. Risk: APAC launch date (Nov 15) is at risk if PHX-148 slips.",
      },
      {
        id: "jira-bug-sec", label: "P0 Bug: Auth Token Leak", type: "analysis", source: "JIRA",
        content: "PHX-138 [P0] Auth Token Leak in API response. Reported: Oct 12 by Nova Health customer. Severity: Critical — access tokens were included in error response body under certain 401 conditions. Root cause: Missing error serializer sanitization in auth middleware. Fix: Strip token fields from all error responses. Status: Patch deployed to staging, pending prod deploy approval from CTO. Affected versions: v0.8.2 – v0.9.1. Customer impact: 2 enterprise accounts potentially exposed. Legal notified. Post-mortem scheduled Oct 16.",
      },
      {
        id: "jira-epic-ml", label: "Epic: ML Pipeline v2", type: "concept", source: "JIRA",
        content: "Epic: ML Pipeline v2 (ML-001). Goal: replace mock/static AI responses with live Groq inference across all features. Scope: (1) Query Console — context-aware RAG with live knowledge graph. (2) Meeting Brain — real-time transcript analysis and post-meeting Groq summary. (3) Ingest pipeline — Groq Llama 3.3 70B for document extraction. (4) SOP drift detection — Groq classification of stale steps. Timeline: 6 weeks. 18 tickets, 12 completed, 6 in progress. Key dependency: Pinecone index schema finalized (ADR-003).",
      },
      {
        id: "jira-ticket-sso", label: "PHX-142: SSO Provider Support", type: "analysis", source: "JIRA",
        content: "PHX-142: Add SSO support via SAML 2.0 and OIDC. Priority: High. Story points: 8. Assignee: Dev Team. Status: In Review. Description: Enterprise customers (Nova Health, Plaid, Rippling) have all requested SSO before contract signing. Support Google Workspace, Okta, and Azure AD as identity providers. Implementation: NextAuth.js with custom SAML adapter. Test coverage required: 90%+ for auth flows. Dependency: PHX-143 (Role mapping spec) — completed.",
      },
    ],
    links: [
      { source: "jira-root", target: "jira-phoenix" },
      { source: "jira-phoenix", target: "jira-sprint" },
      { source: "jira-phoenix", target: "jira-bug-sec" },
      { source: "jira-root", target: "jira-epic-ml" },
      { source: "jira-phoenix", target: "jira-ticket-sso" },
    ],
    syncLog: {
      id: "sync-jira-1",
      source: "jira",
      timestamp: "JUST NOW",
      title: "Sync: Jira Project Phoenix",
      description: "Scanned 42 tickets. Detected 1 P0 bug (Auth Token Leak) linked to APAC sprint. SSO ticket in review — blocks 3 enterprise deals. ML Pipeline v2 epic is 67% complete.",
      impact: ["P0 Bug: Auth Token Leak", "Sprint 42 APAC", "PHX-142 SSO", "ML Pipeline v2"],
      status: "completed",
      alert: true,
    },
    sops: [
      {
        id: "sop-jira-1",
        title: "Sprint Planning Protocol",
        department: "Product",
        status: "current",
        lastUpdated: "JUST NOW",
        staleSteps: 0,
        totalSteps: 6,
        steps: [
          { text: "PM reviews and re-prioritizes backlog 2 days before sprint end — update story points and acceptance criteria", current: true, source: "Jira / Sprint Board" },
          { text: "Engineering lead runs capacity check — subtract PTO, interviews, and on-call hours from available sprint capacity", current: true, source: "Jira / Sprint Board" },
          { text: "Sprint planning meeting (max 90 min): pull tickets from top of backlog until capacity is 80% filled, leave 20% for bugs", current: true, source: "Jira / Sprint Ceremonies" },
          { text: "Assign tickets to engineers — no engineer should have more than 13 points in a 2-week sprint", current: true, source: "Jira / Sprint Board" },
          { text: "Set sprint goal statement in Jira and share in #engineering Slack channel", current: true, source: "Jira / Notifications" },
          { text: "Daily async standup: post update in #standup with format: Done / Doing / Blocked", current: true, source: "Slack / #standup" },
        ],
      },
      {
        id: "sop-jira-2",
        title: "P0 Bug Response Protocol",
        department: "Engineering",
        status: "current",
        lastUpdated: "JUST NOW",
        staleSteps: 0,
        totalSteps: 5,
        steps: [
          { text: "Acknowledge P0 within 15 minutes — assign an incident commander from engineering", current: true, source: "Jira / Incident Policy" },
          { text: "Create war-room Slack channel #incident-YYYY-MM-DD and invite CTO, PM, and on-call engineer", current: true, source: "Slack / Incident Protocol" },
          { text: "Assess customer impact — check affected accounts, notify customer success if enterprise customers impacted", current: true, source: "Jira / Incident Policy" },
          { text: "Deploy hotfix to production within 4 hours — use emergency deploy flow, skip 2-approval requirement with CTO sign-off", current: true, source: "GitHub / Emergency Deploy" },
          { text: "Post-mortem within 48 hours: root cause, timeline, fix, and prevention measures documented in Notion", current: true, source: "Notion / Post-Mortem Template" },
        ],
      },
    ],
  },

  SLACK: {
    nodes: [
      {
        id: "slack-root", label: "Slack Workspace", type: "entity", source: "SLACK", val: 4,
        content: "Superloyee Slack workspace. 14 channels: 6 public (#general, #engineering, #product, #sales, #marketing, #announcements), 4 operational (#standup, #deployments, #incidents, #security-ops), 4 private (leadership, hr-ops, legal, board-updates). 8 active members. Integrations: GitHub (PR notifications), Jira (ticket updates), PagerDuty (alerts), Google Calendar (reminders). 450+ messages/day average.",
      },
      {
        id: "slack-eng", label: "#engineering-alerts", type: "source", source: "SLACK",
        content: "#engineering-alerts channel (now renamed #deployments). Contains: Vercel deploy notifications, GitHub Actions CI results, Sentry error alerts, Datadog anomaly alerts. Key thread Oct 12: 'Auth token exposed in error body — see PHX-138. All hands on deck.' Decision extracted: emergency deploy protocol bypasses 2-approval requirement with CTO sign-off only. Recent alert: ECS task memory spike to 94% during PDF batch ingestion — engineers investigating Groq response buffering.",
      },
      {
        id: "slack-security", label: "#security-ops", type: "source", source: "SLACK",
        content: "#security-ops channel. Members: CTO, 2 senior engineers, external security advisor. Recent discussions: (1) Firewall rule update to block traffic from 3 suspicious IP ranges (completed Oct 10). (2) SOC 2 audit prep — evidence collection started, target completion Nov 30. (3) Employee security training completion rate: 6/8 employees done, 2 overdue. (4) Penetration test findings review — 2 medium findings from Sept test now resolved. Next review: Nov 1.",
      },
      {
        id: "slack-decision-arch", label: "Decision: Migrate to Bun", type: "decision", source: "SLACK",
        content: "Decision: Migrate package manager and runtime from npm/Node to Bun. Extracted from #engineering thread Oct 8. Context: Dev complained about slow install times (npm taking 45s vs Bun's 3s). CTO approved trial. Engineer reported 12x faster installs and 2x faster test runs in cortex-core. Decision: migrate all repos to Bun by end of sprint 42. Consequences: update CI pipelines in GitHub Actions to use oven-sh/setup-bun, update CONTRIBUTING.md. Completed: cortex-core migrated. Pending: infra-terraform (low priority).",
      },
      {
        id: "slack-decision-standup", label: "Decision: Async Standups", type: "decision", source: "SLACK",
        content: "Decision: Replace daily video standup with async text standup in #standup channel. Extracted from #general thread Sept 30. Context: Team spanning IST, EST, and PST timezones — scheduling sync standup was causing burnout. PM proposed async format. Format agreed: post by 10am your local time with Done / Doing / Blocked. Video optional for Mondays. Result: all-hands still meets every Monday 10am IST for alignment. Adopted company-wide Oct 1.",
      },
    ],
    links: [
      { source: "slack-root", target: "slack-eng" },
      { source: "slack-root", target: "slack-security" },
      { source: "slack-root", target: "slack-decision-standup" },
      { source: "slack-eng", target: "slack-decision-arch" },
    ],
    syncLog: {
      id: "sync-slack-1",
      source: "slack",
      timestamp: "JUST NOW",
      title: "Sync: #deployments, #security-ops, #engineering",
      description: "Extracted 2 implicit decisions from thread history (Bun migration, async standups). Auth token incident thread linked to P0 bug PHX-138. Firewall change logged to Security Policies. SOC 2 prep timeline extracted.",
      impact: ["Security Policies", "Decision: Migrate to Bun", "P0 Bug PHX-138", "SOC 2 Timeline"],
      status: "completed",
    },
    sops: [
      {
        id: "sop-slack-1",
        title: "Engineer Onboarding",
        department: "HR",
        status: "outdated",
        lastUpdated: "JUST NOW",
        staleSteps: 2,
        totalSteps: 8,
        steps: [
          { text: "Send offer letter and complete DocuSign paperwork at least 1 week before start date", current: true, source: "Notion / Employee Handbook" },
          { text: "Provision Google Workspace account, 1Password, and Slack on Day 0", current: true, source: "Slack / #hr-ops" },
          { text: "Assign GitHub org permissions with appropriate team membership (engineering/product/design)", current: true, source: "Slack / #hr-ops" },
          {
            text: "Invite to #general channel",
            current: false,
            staleNote: "Onboarding announcement now goes in #announcements. #general is for ongoing discussion only.",
            source: "Slack / #hr-ops",
          },
          { text: "Schedule intro calls: CTO (Day 1), team lead (Day 1), PM (Day 2), full team (Week 1 all-hands)", current: true, source: "Slack / #hr-ops" },
          { text: "Complete security training module in Notion and confirm in #security-ops within first week", current: true, source: "Notion / Employee Handbook" },
          {
            text: "Provision MacBook Air M1",
            current: false,
            staleNote: "Hardware standard updated to MacBook Pro M3 14\" per ops decision Sept 2024. Budget: $2,500.",
            source: "Slack / #operations",
          },
          { text: "Assign onboarding Jira ticket with 30-60-90 day milestones and first project task", current: true, source: "Jira / HR Board" },
        ],
      },
    ],
  },

  INTERCOM: {
    nodes: [
      {
        id: "intercom-root", label: "Intercom Conversations", type: "entity", source: "INTERCOM", val: 4,
        content: "Intercom customer support and messaging platform. 1,452 total conversations analyzed. Active users: 214 across 38 companies. Median first response time: 42 minutes (business hours). Customer satisfaction (CSAT): 94%. NPS: 4.8/5. Churn signals detected: 5 accounts showing reduced activity. Top contact reasons: Auth issues (28%), Billing (18%), Integration setup (24%), Performance (14%), Feature requests (16%).",
      },
      {
        id: "intercom-segment-ent", label: "Segment: Enterprise", type: "concept", source: "INTERCOM",
        content: "Enterprise segment (1000+ employee companies): 12 accounts, $842k ARR. Key accounts: Nova Health ($120k ARR, negotiation stage), Plaid ($200k ARR, discovery), Rippling ($95k ARR, negotiation). Common characteristics: require SSO, SOC 2 compliance proof, MSA review, custom data residency, and dedicated CSM. Average sales cycle: 68 days. Top pain: fragmented knowledge across departments causing decision latency. Top request: real-time meeting intelligence and audit log export.",
      },
      {
        id: "intercom-segment-smb", label: "Segment: SMB", type: "concept", source: "INTERCOM",
        content: "SMB segment (50-500 employee companies): 26 accounts, $186k ARR. Avg contract: $7.2k/year. Churned: 3 accounts in Q3 (reason: 'too expensive', 'didn't see enough value in 30 days'). High engagement: companies with 3+ connected sources have 4x lower churn. Common pain: SOPs going stale, no single source of truth. Top feature usage: Query Console (78%), Feed Sources (65%), Territory Map (41%). Activation bottleneck: users connect sources but don't ask first query within 7 days — need onboarding nudge.",
      },
      {
        id: "intercom-objection-sec", label: "Top Objection: Security Compliance", type: "analysis", source: "INTERCOM",
        content: "Security Compliance objection analysis: 82 enterprise conversations mention security as a blocker. Specific concerns: (1) 'Where is our data stored?' — 67 mentions. (2) 'Do you have SOC 2?' — 54 mentions. (3) 'Can we self-host?' — 23 mentions. (4) 'What happens to our data if we cancel?' — 31 mentions. Current responses: data residency (AWS us-east-1, EU option available), SOC 2 audit scheduled Q1 2025, no self-host option (roadmap Q2 2025), data deletion within 30 days of cancellation. Recommendation: Publish security trust center page to reduce repetitive questions.",
      },
      {
        id: "intercom-req-sso", label: "Feature Request: SSO", type: "analysis", source: "INTERCOM",
        content: "SSO feature request analysis: 112 mentions across 34 companies. Requesters: 89% enterprise segment, 11% mid-market. Urgency: 8 companies explicitly said they cannot sign contract without SSO. Requested providers: Google Workspace (67%), Okta (45%), Azure AD (38%), OneLogin (12%). Timeline ask: 'within 30 days' from 6 accounts. Revenue at risk without SSO: ~$480k ARR from accounts in active negotiation. Status: PHX-142 in review — ETA 2 weeks. Response template: 'SSO via SAML 2.0 and OIDC is in active development, ETA end of October 2024. We support Google Workspace, Okta, and Azure AD.'",
      },
      {
        id: "intercom-churn-risk", label: "Churn Risk: 5 Accounts", type: "analysis", source: "INTERCOM",
        content: "Churn risk accounts (5 detected by Cortex): (1) TechFlow Inc — last login 18 days ago, only 1 source connected, no queries in 2 weeks. Recommended action: CSM outreach. (2) BuildBase — opened 3 billing tickets, downgrade request submitted. Action: offer discount or feature demo. (3) Greystone Analytics — NPS: 2, complained about slow query responses. Action: engineering review of their workspace size. (4) Maple Systems — champion left the company. Action: identify new champion immediately. (5) CloudNine — competing tool evaluation underway per Intercom chat. Action: send competitive comparison doc.",
      },
    ],
    links: [
      { source: "intercom-root", target: "intercom-segment-ent" },
      { source: "intercom-root", target: "intercom-segment-smb" },
      { source: "intercom-root", target: "intercom-churn-risk" },
      { source: "intercom-segment-ent", target: "intercom-objection-sec" },
      { source: "intercom-segment-ent", target: "intercom-req-sso" },
    ],
    syncLog: {
      id: "sync-intercom-1",
      source: "intercom",
      timestamp: "JUST NOW",
      title: "Sync: Intercom Customer Conversations",
      description: "Analyzed 1,452 conversations across 38 companies. 5 churn-risk accounts flagged. SSO blocks $480k ARR. Security objections in 82 enterprise threads. SMB activation gap detected at 7-day query milestone.",
      impact: ["Churn Risk: 5 Accounts", "SSO: $480k at risk", "Security Compliance Objection", "SMB Activation Gap"],
      status: "completed",
      alert: true,
    },
    sops: [],
  },

  TRELLO: {
    nodes: [
      {
        id: "trello-root", label: "Trello Workspace", type: "entity", source: "TRELLO", val: 4,
        content: "Superloyee Trello workspace. 2 active boards: Support Tickets (24 open cards) and Sales Pipeline (8 active deals, $689k total pipeline value). Boards owned by: Sarah K. (Support) and Maya S. (Sales). Automated: cards older than 7 days without activity get flagged. Integration with Slack: critical tickets post to #support-alerts.",
      },
      {
        id: "trello-support", label: "Board: Support Tickets", type: "project", source: "TRELLO",
        content: "Support Tickets board. Lists: New (6 cards), In Progress (8 cards), Waiting on Customer (4 cards), Resolved (6 cards). SLA targets: P0 < 4h, P1 < 8h, P2 < 48h. Current SLA breach: TKT-001 (Refund bug, 2h old, P0 — at risk), TKT-009 (2FA loop, 3d old, P0 — breached). Total open critical+high: 6 tickets. Top categories this week: Auth (3 tickets), API (2 tickets), Billing (2 tickets). Most common root cause: auth middleware edge cases introduced in v0.9.0.",
      },
      {
        id: "trello-sales", label: "Board: Sales Pipeline", type: "project", source: "TRELLO",
        content: "Sales Pipeline board. Total pipeline: $689k across 8 deals. Weighted pipeline (by probability): $412k. Lists: Discovery (2 deals), Demo Done (1 deal), Proposal Sent (2 deals), Negotiation (2 deals), Closed Won (1 deal). At-risk deals: Vercel ($28k — needs SSO, stalled 4 days), Stripe Inc ($160k — evaluating 3 vendors, no recent activity). Best opportunity: Nova Health ($120k, 85% probability, legal review started). Deal velocity: avg 42 days from first touch to close.",
      },
      {
        id: "trello-ticket-refund", label: "Card: Refund Processing Bug", type: "analysis", source: "TRELLO",
        content: "TKT-001: Refund not processing after 48 hours. Customer: Acme Corp. Priority: Critical. Status: Open (2h, at SLA risk). Description: Acme Corp reports that refund requests submitted via the billing API are not being processed — they appear stuck in 'pending' state. No error returned to customer. Stripe webhook logs show event received but not processed. Root cause hypothesis: webhook handler silently failing on currency mismatch. Assignee: Sarah K. Next step: reproduce in staging with Stripe test clock.",
      },
      {
        id: "trello-ticket-sso", label: "Card: SSO Setup Failure", type: "analysis", source: "TRELLO",
        content: "TKT-002: SSO setup failure on Enterprise plan. Customer: Nova Health. Priority: High. Status: In Progress. Description: Nova Health's IT admin cannot complete Okta SSO configuration — SAML assertion fails with 'audience mismatch' error. This is blocking their team from onboarding 40 users. Our SSO setup docs are outdated (reference old entity ID format). Assignee: Dev Team. Action: update docs + push config fix in PHX-142. Customer says if not resolved in 5 days they will escalate to their VP.",
      },
      {
        id: "trello-deal-acme", label: "Deal: Acme Corp ($48k)", type: "concept", source: "TRELLO",
        content: "DEAL-002: Acme Corp. Value: $48k/year. Stage: Proposal Sent. Probability: 65%. Owner: Maya S. Last activity: 1 day ago. Notes: Sent proposal Oct 11. Champion: David L. (Head of Ops). Waiting on budget approval from CFO — expected decision by Oct 20. Objection raised: 'We need to see how it handles our Confluence data first.' Action: schedule Confluence integration demo. Risk: active P0 support ticket (TKT-001) could damage relationship if not resolved fast.",
      },
      {
        id: "trello-deal-nova", label: "Deal: Nova Health ($120k)", type: "concept", source: "TRELLO",
        content: "DEAL-001: Nova Health. Value: $120k/year. Stage: Negotiation. Probability: 85%. Owner: Alex R. Last activity: 2 hours ago. Notes: Legal review underway — MSA sent Oct 10, redlines expected Oct 15. Champion: Priya N. (CTO). Blockers: SSO not working (TKT-002 active). If SSO is fixed this week, deal likely closes by Oct 22. Key ask: EU data residency option confirmed in contract. Note: Nova Health has referred us to 2 other healthcare companies — high expansion potential.",
      },
    ],
    links: [
      { source: "trello-root", target: "trello-support" },
      { source: "trello-root", target: "trello-sales" },
      { source: "trello-support", target: "trello-ticket-refund" },
      { source: "trello-support", target: "trello-ticket-sso" },
      { source: "trello-sales", target: "trello-deal-acme" },
      { source: "trello-sales", target: "trello-deal-nova" },
    ],
    syncLog: {
      id: "sync-trello-1",
      source: "trello",
      timestamp: "JUST NOW",
      title: "Sync: Trello Support & Sales Boards",
      description: "24 support tickets and 8 deals ingested. P0 SLA breach detected on TKT-001. SSO bug (TKT-002) directly risks Nova Health $120k deal. $412k weighted pipeline. 2 at-risk deals flagged (Vercel, Stripe).",
      impact: ["TKT-001 SLA Breach", "Nova Health $120k at risk", "Vercel deal stalled", "$412k weighted pipeline"],
      status: "completed",
      alert: true,
    },
    sops: [
      {
        id: "sop-trello-1",
        title: "Customer Support Escalation Protocol",
        department: "Support",
        status: "current",
        lastUpdated: "JUST NOW",
        staleSteps: 0,
        totalSteps: 5,
        steps: [
          { text: "Acknowledge every new ticket within 30 minutes during business hours — use standard greeting template in Intercom", current: true, source: "Trello / Support Board" },
          { text: "Classify priority on receipt: P0 (data loss/security/complete outage), P1 (major feature broken), P2 (degraded), P3 (cosmetic/question)", current: true, source: "Trello / Support Policy" },
          { text: "P0/P1: immediately post in #support-alerts Slack with ticket ID, customer name, and one-line description", current: true, source: "Slack / #support-alerts" },
          { text: "For enterprise customers with active deals: notify their AE within 15 minutes so they can manage the relationship", current: true, source: "Trello / Sales-Support Handoff Policy" },
          { text: "Resolve and close ticket — send CSAT survey via Intercom 24h after resolution", current: true, source: "Intercom / CSAT Template" },
        ],
      },
    ],
  },

  CONFLUENCE: {
    nodes: [
      {
        id: "confluence-root", label: "Confluence Wiki", type: "entity", source: "CONFLUENCE", val: 4,
        content: "Superloyee Confluence space. 18 pages across 4 spaces: Engineering (8 pages), Product (4 pages), Operations (3 pages), Security (3 pages). Last edited: System Architecture v3 (today). Confluence is used for long-form technical documentation — not decision-making (that happens in Notion) or issue tracking (Jira). Integrated with Jira: tickets link to relevant Confluence pages.",
      },
      {
        id: "confluence-arch", label: "System Architecture v3", type: "analysis", source: "CONFLUENCE",
        content: "Superloyee System Architecture v3 (updated Oct 2024). Frontend: Next.js 15 App Router, deployed on Vercel. Backend: Next.js API routes (serverless), no separate backend service. AI: Groq API (Llama 3.3 70B) for all inference — chat, ingestion, meeting analysis. Vector DB: Pinecone (see ADR-003). State: Zustand with localStorage persistence. Auth: NextAuth.js (planned: add SAML/OIDC for SSO). Storage: AWS S3 for uploaded files. CDN: Vercel Edge Network. Monitoring: Vercel Analytics + Sentry for errors. Key constraint: all AI calls go through Groq — no OpenAI dependency. Known scalability limit: serverless functions have 10s timeout — batch ingestion jobs currently split into chunks to stay under limit.",
      },
      {
        id: "confluence-runbook", label: "Production Runbook", type: "source", source: "CONFLUENCE",
        content: "Production Runbook v2.1. On-call rotation: 2 engineers on weekly rotation. Alert channels: PagerDuty → #incidents Slack. Key procedures: (1) Vercel deployment rollback — use 'vercel rollback [deployment-id]' or click Redeploy in dashboard. (2) Groq API outage — enable fallback mode: return cached responses where available, queue new requests. (3) Pinecone outage — disable vector search, fall back to keyword search in node labels only. (4) Database connection exhaustion — check RDS connection pool in CloudWatch, restart ECS tasks if needed. Emergency contacts: CTO mobile (in 1Password vault), Vercel support (Priority plan), AWS TAM (enterprise support).",
      },
      {
        id: "confluence-adr-db", label: "ADR: Vector DB Selection", type: "decision", source: "CONFLUENCE",
        content: "ADR-003: Vector Database Selection (also tracked in GitHub). Full evaluation matrix: Pinecone — managed, 99.99% SLA, 5ms p95 query, $0.096/1M vectors/month, no ops overhead. Weaviate — open source, self-host required, more flexibility but 2+ weeks to operate reliably. Chroma — local/open source, no managed cloud at eval time, rejected. pgvector — PostgreSQL extension, works at small scale but degrades above 500k vectors. Decision: Pinecone. Implementation notes: use cosine similarity, 1536-dim vectors (OpenAI ada-002 compatible), namespace per customer workspace. Index schema: { id, content, source, nodeType, workspaceId, createdAt }.",
      },
      {
        id: "confluence-api-docs", label: "Public API Reference v1", type: "source", source: "CONFLUENCE",
        content: "Superloyee Public API Reference v1 (internal draft — not yet published). Base URL: api.superloyee.com/v1. Authentication: Bearer token in Authorization header. Rate limits: 100 req/min on Free, 1000 req/min on Pro, custom on Enterprise. Key endpoints: POST /ingest (upload document for processing), GET /nodes (list knowledge graph nodes), POST /query (natural language query against knowledge base), GET /sops (list SOPs with drift status), POST /meeting/analyze (post-meeting transcript analysis). All responses: JSON. Errors follow RFC 7807 Problem Details format. SDK planned for Python and TypeScript in Q1 2025.",
      },
    ],
    links: [
      { source: "confluence-root", target: "confluence-arch" },
      { source: "confluence-root", target: "confluence-runbook" },
      { source: "confluence-root", target: "confluence-api-docs" },
      { source: "confluence-arch", target: "confluence-adr-db" },
    ],
    syncLog: {
      id: "sync-confluence-1",
      source: "confluence",
      timestamp: "JUST NOW",
      title: "Sync: Confluence Engineering & Product Spaces",
      description: "Indexed 5 pages. System Architecture v3 updated today — Groq timeout constraint noted. Production Runbook linked to on-call rotation. API docs draft found — not yet public. ADR-003 cross-linked to GitHub and Jira ML epic.",
      impact: ["System Architecture v3", "ADR: Vector DB Selection", "Production Runbook", "API Reference v1"],
      status: "completed",
    },
    sops: [
      {
        id: "sop-confluence-1",
        title: "Production Incident Runbook",
        department: "Engineering",
        status: "current",
        lastUpdated: "JUST NOW",
        staleSteps: 0,
        totalSteps: 6,
        steps: [
          { text: "PagerDuty alert fires → on-call engineer acknowledges within 5 minutes and posts in #incidents", current: true, source: "Confluence / Production Runbook" },
          { text: "Assess severity: check Vercel function error rates, Sentry error volume, and Groq API status page", current: true, source: "Confluence / Production Runbook" },
          { text: "If Vercel deployment issue: run 'vercel rollback' to previous stable deployment immediately", current: true, source: "Confluence / Production Runbook" },
          { text: "If Groq API degraded: enable fallback mode — return cached responses, queue new inference requests", current: true, source: "Confluence / Production Runbook" },
          { text: "Update #incidents every 15 minutes with status — customers on enterprise plan get proactive email from CSM", current: true, source: "Confluence / Production Runbook" },
          { text: "Post-incident: update status page, write post-mortem in Notion within 48h, create Jira ticket for preventive fix", current: true, source: "Notion / Post-Mortem Template" },
        ],
      },
    ],
  },
};

// Trello data — support tickets + sales pipeline
export const TRELLO_DATA = {
  supportTickets: [
    { id: "TKT-001", title: "Refund not processing after 48h",      priority: "critical", status: "open",        customer: "Acme Corp",    category: "Billing",     created: "2h ago",  assignee: "Sarah K.",  notes: "Stripe webhook received but handler silently fails on currency mismatch. Reproduce in staging with Stripe test clock. P0 SLA at risk — 2h old." },
    { id: "TKT-002", title: "SSO setup failure — Okta audience mismatch", priority: "high", status: "in_progress", customer: "Nova Health", category: "Auth",       created: "4h ago",  assignee: "Dev Team",  notes: "SAML assertion fails with 'audience mismatch'. SSO docs reference old entity ID format. Fix tracked in PHX-142. Blocking 40-user onboarding. Customer escalation risk in 5 days." },
    { id: "TKT-003", title: "API rate limit exceeded on Pro plan",  priority: "high",     status: "open",        customer: "Stripe Inc",   category: "API",         created: "5h ago",  assignee: "Dev Team",  notes: "Customer is on Pro (1000 req/min limit) but hitting limits during batch ingestion. Suspected issue: each chunk of a large PDF counts as separate requests. Engineering to investigate request batching." },
    { id: "TKT-004", title: "Dashboard not loading on Firefox 119", priority: "medium",   status: "open",        customer: "Loom",         category: "Frontend",    created: "7h ago",  assignee: "UI Team",   notes: "Force graph (react-force-graph-2d) fails to render on Firefox 119 — canvas initialization error. Works on Chrome and Safari. Likely WebGL compatibility issue. Workaround: disable WebGL renderer flag." },
    { id: "TKT-005", title: "CSV export includes null rows",        priority: "medium",   status: "resolved",    customer: "Figma",        category: "Data",        created: "1d ago",  assignee: "Sarah K.",  notes: "Resolved. Root cause: nodes with no 'content' field were serialized as null in CSV export. Fix: added null guard in export serializer. Deployed v0.9.2. Customer confirmed resolved." },
    { id: "TKT-006", title: "Webhook not firing on node status change", priority: "high", status: "open",        customer: "Linear",       category: "API",         created: "1d ago",  assignee: "Unassigned",notes: "Customer reports webhook endpoint not receiving events when a knowledge graph node changes type. Webhook logs show event emitted but HTTP call returning 0 (timeout). Possible: webhook URL not reachable from our VPC. Need customer to whitelist our egress IPs." },
    { id: "TKT-007", title: "Transactional emails landing in spam", priority: "low",      status: "open",        customer: "Vercel",       category: "Email",       created: "2d ago",  assignee: "Ops",       notes: "Password reset and invite emails going to spam for Vercel team's corporate Gmail. SPF and DKIM records are set. Likely missing DMARC policy. Ops to add DMARC p=quarantine record and retest." },
    { id: "TKT-008", title: "Bulk import fails above 500 records",  priority: "medium",   status: "in_progress", customer: "Atlassian",    category: "Data",        created: "2d ago",  assignee: "Dev Team",  notes: "Importing 800+ Confluence pages via bulk import fails at ~500 records with a 504 gateway timeout. Serverless function 10s limit hit. Fix in progress: split import into chunks of 100 records with queue-based processing." },
    { id: "TKT-009", title: "Two-factor auth infinite loop on login", priority: "critical", status: "open",       customer: "Plaid",        category: "Auth",        created: "3d ago",  assignee: "Dev Team",  notes: "P0 SLA breached — 3d old. Plaid users with TOTP 2FA enabled get redirected in an infinite loop after entering the correct code. Root cause: session cookie not persisting after 2FA verification step. Hotfix in staging, awaiting CTO prod deploy approval." },
    { id: "TKT-010", title: "Audit log entries missing for bulk ops", priority: "high",   status: "resolved",    customer: "Rippling",     category: "Compliance",  created: "3d ago",  assignee: "Sarah K.",  notes: "Resolved. Audit log was only capturing single-record operations. Bulk operations (import, batch delete) were not emitting log events. Fixed in v0.9.1: added audit middleware to bulk endpoints. Rippling confirmed all entries now visible." },
    { id: "TKT-011", title: "Seat count incorrect after member removal", priority: "medium", status: "open",      customer: "Notion",       category: "Billing",     created: "4d ago",  assignee: "Billing",   notes: "After removing a team member, the billing dashboard still shows the old seat count. Stripe subscription quantity not being updated on member removal. Fix: add Stripe subscription.update call to member removal handler." },
    { id: "TKT-012", title: "Query response >8s on large workspace", priority: "medium",  status: "in_progress", customer: "Atlassian",    category: "Performance", created: "4d ago",  assignee: "Dev Team",  notes: "Atlassian workspace has 1,200+ nodes. Groq prompt context exceeds 8k tokens, causing slow inference. Fix: implement context window trimming — limit to top 50 most-relevant nodes by semantic similarity before sending to Groq." },
  ],
  salesPipeline: [
    { id: "DEAL-001", company: "Nova Health",   value: 120000, stage: "Negotiation",   probability: 85, owner: "Alex R.",  lastActivity: "2h ago",  notes: "MSA redlines expected Oct 15. Champion: Priya N. (CTO). Blocker: SSO bug TKT-002. EU data residency clause needed in contract. Referred us to 2 other healthcare orgs — high expansion potential. Close target: Oct 22." },
    { id: "DEAL-002", company: "Acme Corp",     value: 48000,  stage: "Proposal Sent", probability: 65, owner: "Maya S.", lastActivity: "1d ago",  notes: "Proposal sent Oct 11. Champion: David L. (Head of Ops). Waiting on CFO budget approval by Oct 20. Objection: 'Show me Confluence integration working.' Action: schedule Confluence demo this week. Risk: P0 billing bug TKT-001 could damage relationship." },
    { id: "DEAL-003", company: "Plaid",         value: 200000, stage: "Discovery",     probability: 40, owner: "Alex R.",  lastActivity: "2d ago",  notes: "Largest deal in pipeline. Security questionnaire sent — 47 questions, 2-week turnaround. Champion: engineering director. Key ask: SOC 2 Type II cert (Q1 2025) and self-host option (Q2 2025 roadmap). High value, long cycle — 60-80 day expected." },
    { id: "DEAL-004", company: "Linear",        value: 36000,  stage: "Demo Done",     probability: 72, owner: "Maya S.", lastActivity: "3d ago",  notes: "Demo went very well. VP Eng loved Meeting Brain feature. No champion identified yet at exec level. Objection: pricing per seat doesn't work for their 200-person eng team. Counter: offer team-based pricing for engineering orgs. Follow-up call scheduled Oct 18." },
    { id: "DEAL-005", company: "Rippling",      value: 95000,  stage: "Negotiation",   probability: 78, owner: "Chris T.", lastActivity: "1d ago", notes: "Pricing objection on seat count — want 500 seats at $80/seat vs our $95/seat ask. Counter-offer: $85/seat for 2-year commit. Legal reviewing standard MSA. Champion: Head of Revenue Ops. Decision expected by Oct 25." },
    { id: "DEAL-006", company: "Vercel",        value: 28000,  stage: "Proposal Sent", probability: 55, owner: "Chris T.", lastActivity: "4d ago", notes: "Stalled — no response in 4 days. Blocker: SSO required before contract. PHX-142 in review — 2 weeks to ETA. Email going to spam (TKT-007) may be causing communication gap. Re-engage via LinkedIn." },
    { id: "DEAL-007", company: "Stripe Inc",    value: 160000, stage: "Discovery",     probability: 35, owner: "Alex R.",  lastActivity: "5d ago", notes: "Evaluating Superloyee vs Guru vs Tettra. No activity in 5 days. Champion is a mid-level PM — need exec sponsor. Differentiation to push: real-time meeting intelligence (Guru/Tettra don't have this). Send competitive comparison doc." },
    { id: "DEAL-008", company: "Loom",          value: 22000,  stage: "Closed Won",    probability: 100, owner: "Maya S.", lastActivity: "1d ago", notes: "Contract signed Oct 9. 10 seats, annual billing. Onboarding call scheduled Oct 15. Champion: Head of Product. Expansion opportunity: Loom has 50-person team — upsell path to full org in Q1 2025." },
  ],
};

// Customer intelligence data — only populated when INTERCOM is connected
export const CUSTOMER_INTEL_DATA = {
  totalInteractions: "1,452",
  satisfactionIndex: "94%",
  avgNps: "4.8",
  churnVectors: "5",
  objections: [
    { name: "Security Compliance", count: 82, segment: "Enterprise", trend: "up",   detail: "Top sub-concerns: data residency (67), SOC 2 status (54), self-host option (23), data deletion policy (31). Recommendation: publish a public security trust center page." },
    { name: "API Documentation Gaps", count: 45, segment: "Developers", trend: "down", detail: "Most common complaint: no code examples for the /query endpoint, and webhook payload schema not documented. Partially addressed in v0.9.2 changelog. Full API docs (Confluence draft) to be published Q4." },
    { name: "Pricing Structure", count: 31, segment: "SMB", trend: "flat",  detail: "SMB teams (10-50 seats) find per-seat pricing expensive. Suggestion from 14 customers: offer a team tier with flat pricing. Engineering orgs especially push back on seat-based model." },
    { name: "Onboarding Complexity", count: 24, segment: "SMB", trend: "up",  detail: "New users struggle to understand what to do after connecting first source. 7-day activation gap identified — users who don't run a query in first week have 3x higher churn. Need in-app onboarding nudge after source connection." },
    { name: "Missing Mobile Support", count: 19, segment: "SMB", trend: "flat", detail: "Users want to query the knowledge base from mobile — especially for Meeting Brain summaries after calls. Mobile SDK on Q1 2025 roadmap." },
  ],
  featureRequests: [
    { name: "SSO Integration",        mentions: 112, priority: "high",   detail: "112 mentions across 34 companies. 8 companies blocking contract on SSO. Providers: Google Workspace (67%), Okta (45%), Azure AD (38%). PHX-142 in review — ETA 2 weeks. Revenue at risk: ~$480k ARR." },
    { name: "Multi-region Hosting",   mentions: 68,  priority: "high",   detail: "Enterprise customers in EU and APAC require data to stay in-region. AWS eu-west-1 option exists but not yet exposed in UI. APAC (ap-southeast-1) on roadmap for Q1 2025. Blocking Plaid deal ($200k)." },
    { name: "Audit Logs Export",      mentions: 29,  priority: "medium", detail: "Compliance teams (Rippling, Plaid, Atlassian) need exportable audit logs for internal review and SOC 2 evidence. Basic audit log UI exists. CSV/JSON export endpoint in backlog — 3 story points." },
    { name: "Custom Webhooks",        mentions: 18,  priority: "medium", detail: "Customers want webhooks on knowledge graph events (node added, SOP drift detected, meeting analysis complete). Webhook infra exists for billing — extend to product events. Medium complexity." },
    { name: "Mobile SDK",             mentions: 42,  priority: "medium", detail: "React Native SDK requested most frequently. Use case: query knowledge base from phone during meetings, access Meeting Brain summaries post-call. Q1 2025 roadmap." },
    { name: "Slack Bot Integration",  mentions: 34,  priority: "medium", detail: "34 customers want to query Cortex directly from Slack with /cortex command. High value — meets users where they already are. Could drive daily active usage significantly. 2-week build estimate." },
    { name: "Zapier / Make Connector", mentions: 22, priority: "low",    detail: "SMB customers want no-code automation: 'when new Notion page → ingest into Cortex', 'when meeting ends → send summary to Slack'. Zapier connector would open a long tail of use cases without custom API work." },
  ],
  personas: [
    {
      title: "The Enterprise Security Lead",
      size: "1000+",
      pain: "Uncontrolled data fragmentation — sensitive decisions made in Slack, no audit trail, compliance team can't trace who decided what",
      value: "Neural audit trails, SOC 2-ready knowledge graph, SSO + RBAC, full decision provenance across all connected sources",
    },
    {
      title: "The Growth PM",
      size: "50-200",
      pain: "Decision latency — engineers waiting 2 days for context that exists somewhere in Notion or a Slack thread nobody can find",
      value: "Instant cross-tool context via Query Console, real-time meeting intelligence flags relevant past decisions during standups",
    },
    {
      title: "The Ops Automator",
      size: "200-500",
      pain: "SOPs go stale the moment they're written — actual process drift not detected until something breaks in production or a compliance audit",
      value: "SOP Autopilot continuously compares live process data against documented procedures and flags exactly which steps are outdated",
    },
    {
      title: "The Founder / CEO",
      size: "10-50",
      pain: "In 10 meetings a day, context-switching between tools — forgets what was decided in last week's call, spends 20 min finding a Notion doc before every investor update",
      value: "Meeting Brain joins every call, surfaces relevant KB context in real-time, generates post-meeting action items automatically",
    },
  ],
};
