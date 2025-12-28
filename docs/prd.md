# Prism MVP PRD (Product + UI/UX + Versioning)

## 1) Product Summary

**Product name:** Prism  
**MVP goal:** Turn a new project idea into a complete initial doc set (Project Brief, Scope, Epics, Stories, Roadmap, Assumptions/Risks), then let users refine via chat-driven edits with versioning and commit-like control.

**Target users (MVP):**
- Indie builders / small teams
- Students / hackathon teams
- PM + engineer duo

**Core promise:** “Like v0.dev, but for project documentation.”

---

## 2) MVP Scope

### Must-have (MVP)
1. **Project creation form** → generate initial docs set
2. **Documents workspace** (view + edit)
3. **Chat to modify docs** (with “apply changes”)
4. **Versioning** (history + restore)
5. **Epics / Stories / Roadmap views** (derived from docs or stored as structured entities)
6. **Commit control** (accept/reject AI changes)

### Nice-to-have (later)
- Team collaboration, roles, comments
- External export (Notion/GitHub/Jira)
- Advanced doc graph + conflict detection
- Hybrid search / deeper RAG

---

## 3) Documents in MVP (Canonical Set)

Each project has these doc types (one canonical doc each):
- Project Brief
- Scope & Features
- Epics
- User Stories
- Roadmap
- Assumptions & Risks

Rule: **one canonical doc per type per project**.

---

## 4) UX Concept: “Generate → Review → Chat → Propose Changes → Commit”

### Why “Commit” matters
Users need control. AI should not silently overwrite:
- Users review diffs
- Users approve “apply” or “discard”
- Versions are saved so they can roll back

This makes Prism feel safe and professional.

---

## 5) UI/UX (Single Document, Minimal Screens)

### Navigation (simple)
Left sidebar (inside a project):
- Overview
- Documents
- Epics
- Stories
- Roadmap
- History (optional, can be inside Documents)

### Screen A: Create Project (v0.dev style)
**Layout**
- Title: “Create a project”
- Form sections (progressive):
  - Project name
  - Problem & target user
  - Goal / success metric
  - Constraints (timeline/tech)
  - MVP focus

**Primary CTA**
- “Generate documents”

**Generation experience**
- Show a progress indicator: “Creating Project Brief… Scope… Epics…”
- Then land on Documents with everything generated

---

### Screen B: Documents (Core)
**Layout:**
- Left: doc list (6 items)
- Right: editor (Markdown or section-based)

**Doc actions:**
- Edit manually
- “Regenerate section”
- “Improve clarity”
- “Make shorter”
- “Check consistency” (optional)

**Versioning access:**
- Top right: “History”
- Shows versions with timestamp + message
- Restore button

---

### Screen C: Chat (Should you have a chat page?)
**Recommendation (MVP): YES — but keep it simple.**

You have two good patterns:

#### Option 1 (Best): Chat panel inside Documents page
- Right side or bottom drawer “Chat with this doc / this project”
- Chat context automatically includes current doc (and optionally other docs)

Pros: users never leave editing flow  
Cons: slightly more UI work

#### Option 2 (Simpler): Dedicated Chat page
- “Chat” tab in sidebar
- User selects scope: “Project / Current doc / Specific doc”
- Chat produces “Proposed changes” cards

Pros: easiest to implement  
Cons: less integrated feeling

**MVP recommendation:** Start with **Chat page** OR **Chat drawer**, whichever is faster.  
Key is not where chat lives — it’s the **change proposal + commit** flow.

---

## 6) Chat Editing Flow (Critical)

### Desired flow
1. User: “Change MVP to only include docs + roadmap, remove integrations.”
2. System response:
   - Short explanation
   - A **Proposed Changes** block:
     - Which docs will change
     - Summary of changes
3. User sees a **diff preview**
4. User chooses:
   - **Apply** (commit changes)
   - **Discard**
   - **Edit before apply** (optional)
5. New version is created.

### UX components you need
- Proposed change card:
  - “This will update: Scope, Epics, Roadmap”
  - Buttons: Preview / Apply / Discard
- Diff modal:
  - before vs after (or inline diff)

---

## 7) Versioning Model (Simple but Real)

### What “versioning” should mean in MVP
- Every time user clicks **Apply**, create a new version of that document.
- Also create versions for manual edits when user clicks **Save**.

### “Commit” concept (MVP)
You can implement “commit” in two levels:

**Level 1 (Simplest): Per-document version**
- Apply changes → creates DocumentVersion
- No multi-doc atomic commit

**Level 2 (Better): ChangeSet commit across multiple docs**
- A single chat action updates several docs
- All updated docs share one commitId
- Users can revert the whole change set

**MVP recommendation:** Implement **Level 2 if you can** (it feels like a real “commit”),
but Level 1 is acceptable if time is tight.

---

## 8) Database Changes (Do you need to change the DB?)

You can keep your current design and add **2–3 tables** for versioning/commit.

### Keep (from your current DB)
- Project
- Document (canonical doc record)
- Epic, Story, RoadmapItem (structured planning)
- AiRun
- EmbeddingChunk (pgvector)

### Add for versioning

#### A) DocumentVersion (required)
Stores snapshots of document content.

**DocumentVersion**
- id
- documentId (FK)
- projectId (FK)
- versionNumber (int)
- contentMd (text)
- createdAt
- createdByUserId (optional)
- sourceAiRunId (optional)
- changeSetId (optional FK)  ← links multi-doc changes

Rule: Document holds latest, DocumentVersion holds history.

#### B) ChangeSet (recommended for “commit”)
Represents one user-approved change (often from chat) that may update multiple docs.

**ChangeSet**
- id
- projectId
- title (e.g. “Narrow scope to MVP docs only”)
- message (optional)
- status (PROPOSED | COMMITTED | DISCARDED)
- createdAt
- createdByUserId
- sourceAiRunId (optional)

#### C) ProposedChange (optional but helpful)
If you want to store proposals before commit.

**ProposedChange**
- id
- changeSetId
- documentId
- proposedContentMd
- diffSummary (optional)
- createdAt

**MVP alternative:** skip ProposedChange and generate diff in memory.

---

## 9) Data Model Rules (After Adding Versioning)

- Document = canonical “current” state
- DocumentVersion = immutable history
- ChangeSet = a commit-like event
- A chat action:
  - creates ChangeSet (PROPOSED)
  - generates updated content
  - user applies → ChangeSet becomes COMMITTED
  - create DocumentVersion rows for each changed doc
  - update Document.contentMd to latest

---

## 10) Structured Data vs Doc Text (Epics/Stories/Roadmap)

You have two choices:

### Option A: Store epics/stories/roadmap as structured tables (recommended)
- Epic/Story/RoadmapItem tables remain source of truth
- The “Epics doc” / “Stories doc” / “Roadmap doc” is a rendered view (Markdown generated from rows)

Pros: easier filtering, editing, UI tables  
Cons: must keep doc view synced (but that’s manageable)

### Option B: Store them only inside Document markdown
Pros: simplest DB  
Cons: hard to build “Stories table UI” and hard to query

**MVP recommendation:** Use **Option A** (structured tables) + render markdown documents.

---

## 11) Do we need vector DB now?

If you implement chat modification, retrieval helps.
**Recommendation:** Postgres + pgvector with EmbeddingChunk, project-scoped retrieval.

In MVP:
- Index the 6 documents + epic/story text
- Chat uses topK chunks filtered by projectId
- This makes chat edits more accurate and consistent

---

## 12) MVP Acceptance Criteria

### Project creation
- User can fill form and generate 6 docs
- Docs are saved in DB
- Epics/stories/roadmap items are created as structured data (if using Option A)

### Editing
- User can edit a doc manually and save
- A version is created on save

### Chat modification
- User can ask to modify docs
- System produces proposed changes
- User can preview diff
- User can apply or discard
- Apply creates new version(s) and updates canonical docs

### History
- User can view versions and restore one

---

## 13) Minimal UI Checklist (Build Order)

1. Create Project form (wizard)
2. Documents page (list + editor)
3. Generate pipeline (server actions / API)
4. Version history for a doc
5. Chat page/panel + propose changes
6. Diff preview + Apply/Discard
7. Epics/Stories/Roadmap table pages

---
