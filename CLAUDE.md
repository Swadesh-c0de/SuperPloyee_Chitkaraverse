# Project Hail Mary — Knowledge Base

This is an incremental, LLM-maintained knowledge base for our company. The LLM reads raw sources, synthesizes knowledge, and maintains a structured wiki of interlinked markdown files.

The LLM **must** read this file before performing any wiki operation. It defines the schema, conventions, and workflows that govern the entire knowledge base.

---

## Architecture

The system is organized into three layers:

| Layer | Purpose | Ownership |
|-------|---------|-----------|
| `raw/` | Immutable source documents (articles, documents, transcripts, Slack exports, assets) | **Human-owned.** Never modify. |
| `wiki/` | Structured markdown knowledge base | **LLM-owned.** The LLM maintains this layer entirely. |
| `CLAUDE.md` | This file. Schema, conventions, and instructions. | **Shared.** Defines how the LLM operates the wiki. |

---

## Directory Structure

```
project-root/
├── CLAUDE.md                  # This file — schema & instructions
│
├── raw/                       # Immutable source documents
│   ├── articles/              # Web articles, blog posts, news
│   ├── documents/             # PDFs, reports, whitepapers, memos
│   ├── transcripts/           # Meeting transcripts, interviews
│   ├── slack/                 # Slack exports, chat logs
│   └── assets/                # Images, diagrams, attachments
│
├── wiki/                      # LLM-maintained knowledge base
│   ├── index.md               # Master index of all wiki pages (by type)
│   ├── log.md                 # Append-only changelog of all wiki operations
│   ├── overview.md            # High-level company/domain overview narrative
│   │
│   ├── sources/               # Summaries of ingested raw sources
│   ├── entities/              # People, companies, products, teams, tools
│   ├── concepts/              # Ideas, technologies, methodologies, domains
│   ├── projects/              # Project trackers
│   ├── decisions/             # ADR-style decision records
│   ├── analyses/              # Filed query results, comparisons, investigations
│   │
│   └── _templates/            # Page templates (used by LLM when creating pages)
│
└── tools/
    └── src/                   # CLI tooling source code
```

---

## Page Types & Frontmatter

All wiki pages use YAML frontmatter. Every page **must** include these shared fields:

```yaml
---
type: source|entity|concept|project|decision|analysis
title: "Page Title"
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
sources: []
---
```

### 1. Source (`wiki/sources/`)

Summary of an ingested raw source document. One source page per raw file.

**Additional fields:**

```yaml
source_file: raw/articles/example.md    # Path relative to project root
source_type: article|document|transcript|slack|report
author: "Author Name"
date_published: YYYY-MM-DD
key_entities: []                         # List of entity names mentioned
key_concepts: []                         # List of concept names mentioned
```

**Required sections:** Summary, Key Points, Detailed Notes, Quotes & Evidence, Implications, Related

### 2. Entity (`wiki/entities/`)

People, companies, products, teams, or tools referenced across sources.

**Additional fields:**

```yaml
entity_type: person|company|product|team|tool
aliases: []                              # Alternative names or abbreviations
status: active|inactive|archived
```

**Required sections:** Overview, Key Details, Timeline, Related

### 3. Concept (`wiki/concepts/`)

Ideas, technologies, methodologies, or domain knowledge areas.

**Additional fields:**

```yaml
confidence: high|medium|low|emerging
```

**Required sections:** Definition, Context, Key Aspects, Open Questions, Related

- `high` — Well-established across multiple sources
- `medium` — Supported by at least one credible source
- `low` — Mentioned but not well-substantiated
- `emerging` — Newly introduced, insufficient data to assess

### 4. Project (`wiki/projects/`)

Project trackers for ongoing or historical initiatives.

**Additional fields:**

```yaml
status: active|completed|planned|paused
owner: "Owner Name"
started: YYYY-MM-DD
completed: YYYY-MM-DD                    # Optional — only if completed
```

**Required sections:** Objective, Status Updates, Key Decisions, Related

### 5. Decision (`wiki/decisions/`)

ADR-style (Architecture Decision Record) decision records.

**Additional fields:**

```yaml
status: proposed|accepted|deprecated|superseded
date_decided: YYYY-MM-DD
decided_by: []                           # List of people involved
superseded_by: "page-name"               # Optional — link to replacement decision
```

**Required sections:** Context, Decision, Consequences, Related

### 6. Analysis (`wiki/analyses/`)

Filed query results, comparisons, and investigations. Created when a query produces a reusable, substantial answer.

**Additional fields:**

```yaml
question: "The original question that prompted this analysis"
sources_consulted: []                    # List of wiki pages read to answer
```

**Required sections:** Question, Methodology, Findings, Conclusion, Related

---

## Conventions

### Filenames

- **kebab-case** only: `acme-corp.md`, `quarterly-review-q3.md`, `machine-learning.md`
- No spaces, no uppercase, no special characters beyond hyphens

### Links

- Use **Obsidian-style `[[wikilinks]]`** with the page title: `[[Acme Corp]]`
- Section links: `[[Page Title#Section Name]]`
- Wikilinks resolve by matching the `title` field in frontmatter, not the filename

### Dates

- **ISO 8601** format: `YYYY-MM-DD` (e.g., `2025-01-15`)

### Tags

- **kebab-case** in frontmatter arrays: `tags: [competitive-analysis, q3-review]`
- In body text, use `#` prefix: `#competitive-analysis`

### Tone

- Professional, factual, concise
- Avoid hedging language ("might", "perhaps", "it seems")
- State facts with source attribution; state uncertainties with confidence levels

### Related Section

- **Every page must end with a `## Related` section**
- List explicit backlinks to all related pages using `[[wikilinks]]`
- **Bidirectional linking is mandatory**: if page A links to page B, then page B must link back to page A in its Related section

### Callout Blocks

Use GitHub-flavored blockquote callouts:

```markdown
> ℹ️ **Note**: Additional context.

> ⚠️ **Contradiction**: Conflicting information from sources.

> ✅ **Confirmed**: Verified across multiple sources.
```

---

## Workflows

### Ingest Workflow

**Trigger:** The user asks to ingest a source (e.g., "ingest `raw/articles/ai-strategy.md`").

**Steps:**

1. **Read** the raw source file completely. Do not modify it.
2. **Discuss** key takeaways with the user. Confirm understanding before proceeding.
3. **Create a source summary page** in `wiki/sources/` using the source template.
   - Extract all key entities and concepts.
   - Write a thorough summary with citations to specific parts of the raw source.
4. **For each key entity mentioned:**
   - If an entity page **exists** → update it with new information; add the source to its `sources` frontmatter and body.
   - If an entity page **does not exist** → create it using the entity template.
5. **For each key concept mentioned:**
   - If a concept page **exists** → update it; cite the new source.
   - If a concept page **does not exist** → create it using the concept template.
6. **Update `wiki/index.md`** — add table entries for all new pages; update entries for modified pages.
7. **Update `wiki/overview.md`** if the source changes the big-picture understanding.
8. **Append to `wiki/log.md`** using the log format (see below).
9. **Verify bidirectional links** — ensure all cross-references go both ways.

### Query Workflow

**Trigger:** The user asks a question about the knowledge base (e.g., "What do we know about Acme Corp's AI strategy?").

**Steps:**

1. **Read `wiki/index.md`** to identify relevant pages.
2. **Read the relevant wiki pages** to gather information.
3. **Synthesize an answer** with `[[wikilink]]` citations to wiki pages.
4. If the answer is **substantial or reusable**, offer to file it as an analysis page in `wiki/analyses/`.
5. If filing:
   - Create the analysis page.
   - Update `wiki/index.md`.
   - Append to `wiki/log.md`.

### Lint Workflow

**Trigger:** The user asks to lint or health-check the wiki (e.g., "lint the wiki").

**Steps:**

1. **Scan all wiki pages** for:
   - 🔴 **Errors:**
     - Broken `[[wikilinks]]` — links to pages that don't exist
     - Missing or invalid frontmatter fields
   - 🟡 **Warnings:**
     - Orphan pages — no inbound links from any other page
     - Pages missing `## Related` sections
     - One-directional links (A → B but B ↛ A)
   - 🔵 **Suggestions:**
     - Stale pages — not updated recently relative to newer sources
     - Entities or concepts mentioned in body text but lacking their own page
     - Pages with very thin content that could be expanded
2. **Report findings** organized by severity (errors → warnings → suggestions).
3. **Offer to fix** issues — create missing pages, add missing backlinks, fill in frontmatter, etc.
4. **Append to `wiki/log.md`** with format: `## [YYYY-MM-DD] lint | Health Check`

---

## Handling Contradictions

When new source information contradicts existing wiki content:

1. **DO NOT silently overwrite** the old information.
2. **Add a contradiction callout** on the affected page:
   ```markdown
   > ⚠️ **Contradiction**: [[Source A]] states X, but [[Source B]] states Y.
   > As of YYYY-MM-DD, the most recent source supports Y.
   ```
3. **Keep both claims visible** with their respective sources cited.
4. **Update the `confidence` level** on concept pages if applicable (e.g., downgrade from `high` to `medium`).
5. If the contradiction is significant, **note it in `wiki/log.md`**.

---

## Index Format

The `wiki/index.md` file is the master directory of all wiki pages, organized by type using tables.

```markdown
# Wiki Index

> Last updated: YYYY-MM-DD

## Sources
| Page | Source Type | Summary | Date Ingested |
|------|------------|---------|---------------|
| [[Source Title]] | article | One-line summary | YYYY-MM-DD |

## Entities
| Page | Type | Status | Summary | Updated |
|------|------|--------|---------|---------|
| [[Entity Name]] | company | active | One-line summary | YYYY-MM-DD |

## Concepts
| Page | Confidence | Summary | Updated |
|------|------------|---------|---------|
| [[Concept Name]] | high | One-line summary | YYYY-MM-DD |

## Projects
| Page | Status | Owner | Summary | Updated |
|------|--------|-------|---------|---------|
| [[Project Name]] | active | Owner | One-line summary | YYYY-MM-DD |

## Decisions
| Page | Status | Date Decided | Summary |
|------|--------|-------------|---------|
| [[Decision Title]] | accepted | YYYY-MM-DD | One-line summary |

## Analyses
| Page | Question | Date Filed |
|------|----------|------------|
| [[Analysis Title]] | Original question | YYYY-MM-DD |
```

---

## Log Format

The `wiki/log.md` file is an **append-only** changelog. Every wiki operation gets an entry.

```markdown
# Wiki Log

## [YYYY-MM-DD] action | Title
- Description of what happened
- Pages created: [[Page 1]], [[Page 2]]
- Pages updated: [[Page 3]]
```

**Valid actions:** `ingest`, `query`, `lint`, `update`, `create`

**Examples:**

```markdown
## [2025-01-15] ingest | AI Strategy Report Q4
- Ingested raw/documents/ai-strategy-q4.pdf
- Pages created: [[AI Strategy Report Q4]], [[Acme Corp]], [[Transformer Architecture]]
- Pages updated: [[Machine Learning]], [[Q4 Planning]]

## [2025-01-16] query | Competitive Landscape Summary
- Answered question about competitor positioning
- Filed as analysis: [[Competitive Landscape Summary]]
- Pages created: [[Competitive Landscape Summary]]

## [2025-01-17] lint | Health Check
- Found 3 broken links, 2 orphan pages, 5 missing Related sections
- Fixed: added backlinks to 4 pages, created [[Missing Entity]]
- Pages created: [[Missing Entity]]
- Pages updated: [[Acme Corp]], [[AI Strategy]], [[Overview]]
```

---

## CLI Tools

Available via npm scripts from the project root:

| Command | Description |
|---------|-------------|
| `npm run search -- <query>` | Full-text search across all wiki pages |
| `npm run ingest -- <path>` | Validate a raw source file and generate an ingestion checklist |
| `npm run lint:wiki` | Run automated wiki health checks (broken links, orphans, etc.) |
| `npm run stats` | Show wiki statistics (page counts, link density, freshness) |

---

## Quick Reference

| What | Where |
|------|-------|
| Add a new raw source | Drop it in the appropriate `raw/` subdirectory |
| Ingest a source | Say "ingest `raw/<path>`" |
| Ask a question | Just ask — the LLM will consult the wiki |
| File a decision | Say "record a decision about X" |
| Health check | Say "lint the wiki" |
| See everything | Read `wiki/index.md` |
| See recent changes | Read `wiki/log.md` |
