<div align="center">

# CORTEX — Superployee

### Ambient Intelligence for Your Company

*Connect every tool your company uses. Ask anything. Cortex knows.*

</div>

---

Cortex is a **living, AI-powered knowledge operating system** for businesses. It ingests your company's scattered knowledge — from Notion docs to Slack threads to GitHub repos to live meetings — builds a persistent neural knowledge graph, and lets anyone query it in natural language. No more hunting through 12 tabs to answer a simple question.

---

## Table of Contents

- [Onboarding Flow](#onboarding-flow)
- [Constellation — The Neural Knowledge Graph](#constellation--the-neural-knowledge-graph)
- [Query Console](#query-console)
- [Sync History](#sync-history)
- [Territory Map](#territory-map)
- [Meeting Brain](#meeting-brain)
- [Customer Intel](#customer-intel)
- [Onboarding Copilot](#onboarding-copilot)
- [SOP Autopilot](#sop-autopilot)
- [Wiki Health](#wiki-health)
- [Feed Sources](#feed-sources)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)

---

## Onboarding Flow

Cortex begins with a multi-step initialization protocol that seeds your neural net with your company's identity, mission, team structure, and focus areas before you connect a single source.

**Step 1 — Initialize Your Instance**

Set your company name, industry, and deployment scale. This seeds the root identity node in the knowledge graph.

![Initialize Instance](ss/Screenshot_20260410_055551.png)

**Step 2 — Linguistic Training: Mission**

Tell Cortex what your company does in plain language. This trains the AI's contextual reasoning to always answer within the frame of your business.

![Mission Step](ss/Screenshot_20260410_055623.png)

**Step 3 — Who Is Your Customer?**

Define your ICP. Cortex uses this to weight customer-facing intelligence and prioritize relevant signals from support and sales data.

![Customer Step](ss/Screenshot_20260410_055658.png)

**Step 4 — Core Problem**

State the single biggest problem you're solving. Cortex anchors all strategic queries and SOP suggestions to this framing.

![Problem Step](ss/Screenshot_20260410_055729.png)

**Step 5 — Sector Alignment**

Select the organizational dimensions to index. Cortex activates intelligence modules (Customer Intel, SOP Autopilot, etc.) based on the sectors you enable.

![Sector Alignment](ss/Screenshot_20260410_055743.png)

**Step 6 — Optimization Nodes**

Choose what Cortex should optimize for: automating internal processes, better business decisions, customer intelligence, competitive analysis, employee onboarding, and more.

![Optimization Nodes](ss/Screenshot_20260410_055753.png)

**Step 7 — Neural Assembly**

Cortex constructs its initial knowledge graph from your identity parameters, counting 124 seed nodes before you've connected a single source.

![Neural Assembly](ss/Screenshot_20260410_055804.png)

---

## Constellation — The Neural Knowledge Graph

The heart of Cortex. Every piece of company knowledge — docs, repos, tickets, conversations, decisions — becomes a node in a live, interactive force-directed graph.

**Source connection in progress** — Cortex establishes an encrypted OAuth tunnel, fetches workspace hierarchy, queries databases, maps block structures, and syncs to the knowledge graph.

![Connecting Notion](ss/Screenshot_20260410_055832.png)

**The Constellation view** — your company's knowledge rendered as a living neural network. 77% neural integrity, 6 verified pathways, 5ms latency. Nodes are typed (source, entity, concept, project, decision, analysis) and linked by semantic relationships.

![Constellation Dashboard](ss/Screenshot_20260410_055912.png)

**Live graph with GitHub org synced** — paste `https://github.com/harshcodesdev` and Cortex fetches all 87 public repos, creates nodes for every repository with full metadata, and links them to the org entity node. The graph explodes with new connections in real-time.

![GitHub Org Graph](ss/Screenshot_20260410_055948.png)

> Supports both org-level syncs (`github.com/org`) and single-repo syncs (`github.com/org/repo`). All nodes are persisted in the knowledge store and immediately queryable.

---

## Query Console

Ask anything about your connected knowledge base in natural language. Cortex reasons over all active nodes, builds context from your knowledge graph, and returns answers with a full reasoning trace showing which sources it consulted.

**Example query:** *"Which is the second highest repo in terms of stars in harshdeep's GitHub account?"*

Cortex scans all 87 synced repo nodes, ranks by star count, and returns the precise answer with source attribution — no hallucination, grounded in your actual data.

![Query Console](ss/Screenshot_20260410_060029.png)

The **Reasoning Trace** panel on the right shows exactly which nodes Cortex accessed: `Find Most-Active`, `Find App`, `Extract All Nodes` — full transparency into how the answer was constructed. Connected sources shown in the footer.

---

## Sync History

A real-time timeline of every knowledge ingestion event. Track what was synced, when, and what impact it had on the knowledge graph.

![Sync History](ss/Screenshot_20260410_060041.png)

- **GitHub sync** — "Synced: Harsh Deep (87 repos)" — indexed all public repositories, all nodes added to knowledge graph
- **Notion sync** — "Sync: Notion Workspace" — 6 pages ingested across 3 databases, Product Roadmap Q4 and Security Policies cross-linked to 4 existing nodes, 1 stale SOP step flagged
- Connect a GitHub org or user URL directly from the sidebar — the input accepts both `https://github.com/org-name` (all repos) and `https://github.com/org/specific-repo`

---

## Territory Map

A structured, filterable view of every node in your knowledge graph organized by source. Filter by type: Entity, Project, Source, Decision. See exactly what Cortex knows.

![Territory Map](ss/Screenshot_20260410_060053.png)

- **94 total nodes** across **2 sources**, **3 apps connected**, **3 syncs**
- GitHub card shows 86 nodes of 7 types — entity node (GitHub: Harsh Deep) plus all 87 source nodes for each repo
- Notion card shows 5 nodes: 1 entity, 1 project, 3 sources, 1 decision
- Click any node to inspect its full content and connections

---

## Meeting Brain

Cortex joins your meetings as a silent observer. It listens to the live transcript, matches conversation topics against your knowledge base in real-time, and surfaces relevant context from your connected sources — without interrupting the call.

**Standby mode** — paste a Google Meet, Zoom, or Teams URL and deploy the Cortex bot. It shows how many knowledge nodes and sources are active and ready.

![Meeting Brain Standby](ss/Screenshot_20260410_060110.png)

**Live session** — real-time transcript streams word by word. As participants speak, Cortex detects knowledge-base matches and surfaces them in the **Cortex Intelligence** panel. In this session, the phrase "knowledge graph" triggered a match across Product Roadmap Q4, Confluence System Architecture v3, and Notion — surfaced without anyone having to search.

![Meeting Brain Live](ss/Screenshot_20260410_060146.png)

---

## Customer Intel

Cortex analyzes your Trello support tickets and Intercom conversations to surface actionable customer intelligence. One click triggers the resolution engine.

**Auto-resolution scan** — Cortex scans all 12 open tickets, classifies auto-resolvable issues, and drafts responses and actions for each.

![Customer Intel](ss/Screenshot_20260410_060209.png)

---

## Onboarding Copilot

Generate fully structured onboarding roadmaps from your knowledge base in seconds. Cortex pulls from your SOPs, handbooks, architecture docs, and team structure to build personalized plans.

**Select onboarding type** — Client Onboarding (activation roadmap) or Employee Onboarding (30-60-90 day plan tailored by role and department).

![Onboarding Copilot](ss/Screenshot_20260410_060226.png)

**Building the roadmap** — Cortex scans the knowledge base, indexes relevant nodes, links dependencies, reasons over context, and composes the roadmap. Shows exactly which documents it pulled: Company Overview Wiki, Onboarding SOP v2.0, Product Architecture Guide, Q4 Strategy Document, Team Structure & Contacts, Security & Compliance Policy.

![Building Roadmap](ss/Screenshot_20260410_060245.png)

**Generated roadmap** — a full phased plan with priorities, time estimates, and specific action items for each milestone. Export to PDF or share directly.

![Generated Roadmap](ss/Screenshot_20260410_060258.png)

---

## SOP Autopilot

Cortex generates and maintains Standard Operating Procedures from your connected knowledge sources. SOPs are structured with triggers, goals, constraints, steps, if-then rules, variables, and outputs — ready for simulation.

**Example SOP: Student Account Refund Handling** — 8 steps with type annotations (MANUAL, AT ACTION, DECISION, AI ACTION), trigger conditions, 7-day processing goal, and constraint rules. Cortex auto-generated this from the support ticket data and billing policies in the knowledge graph.

![SOP Autopilot](ss/Screenshot_20260410_060423.png)

---

## Wiki Health

A diagnostic dashboard that monitors the health and completeness of your knowledge graph. Detects anomalies, gaps, and growth opportunities.

![Wiki Health](ss/Screenshot_20260410_060430.png)

- **Coverage Index** — 57% (4 of 7 categories active)
- **Freshness Index** — 100% (all syncs up to date)
- **Link Integrity** — 90% (101 nodes linked across 4 sources)
- **Completeness** — 50% (4 artifacts, 2 seed SOPs, 1 roadmap, 1 wiki notes)
- **Diagnostic Trace** — anomalies detected: "Critical alerts in sync logs" (Trello Support & Sales Boards), "Unconnected data sources" (Jira, Slack, Intercom, Confluence)
- **Neural Growth Opportunities** — AI-suggested integrations: "GitHub repos are connected but no Confluence wiki — add Confluence to cross-reference ADRs with architecture docs"
- **SOP Health** — real-time status on all active SOPs (current vs outdated)

---

## Feed Sources

Connect all your company's data sources in one place. Documents tab for file uploads, App Connectors tab for integrations.

![Feed Sources](ss/Screenshot_20260410_060449.png)

**Supported connectors:**
- **Notion** — Active Sync
- **Google Drive** — Active Sync
- **GitHub** — Active Sync (org URL or single repo)
- **Jira** — Active Sync
- **Confluence** — Pending
- **Intercom** — Pending
- **Linear** — Pending
- **Loom** — Pending

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Instrument Sans |
| Components | shadcn/ui + Radix UI |
| Animations | Framer Motion |
| State | Zustand (with localStorage persistence) |
| AI Inference | Groq API — Llama 3.3 70B |
| Knowledge Graph | react-force-graph-2d |
| Runtime | Bun |
| Deploy | Vercel |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-org/superloyee

# Install dependencies (uses Bun)
cd web
bun install

# Set up environment
cp .env.example .env.local
# Add your GROQ_API_KEY to .env.local

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) and complete the Cortex initialization protocol to seed your instance.

### Environment Variables

```env
GROQ_API_KEY=your_groq_api_key_here
```

> No database required. All knowledge graph state is persisted in the browser via Zustand's localStorage adapter. Connect your first source from the Feed Sources page to begin building your neural net.

---

<div align="center">

Built for the hackathon. Ambient intelligence, not a chatbot.

</div>
