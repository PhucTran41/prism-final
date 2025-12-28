# Prism MVP – Database Design Document

This document describes the **database design** for the Prism MVP.  
It is written to be **simple, explicit, and readable** for both humans and tools like Cursor.

The design supports:
- Project documentation
- Epics, user stories, and roadmap planning
- AI-generated content with traceability
- Semantic search and “chat with project” via vector embeddings

---

## 1. Design Principles

- One project is the **root container**
- Documents are **canonical** (one per type per project)
- Planning data (epics, stories, roadmap) is **structured**
- AI-generated content is **traceable**
- Vector search is **project-scoped**
- MVP-first: no premature optimization
- IDs are incremental integers across all entities
- Every entity includes audit fields: `createdAt`, `updatedAt`, `deletedAt`, `createdBy`, `updatedBy`, `deletedBy`

---

## 2. Core Entities Overview

High-level relationships:

```text
User
└─ Project
   ├─ ProjectMember (User membership)
   ├─ Document
   │  ├─ DocumentSection
   │  ├─ DocumentVersion
   │  │  └─ DocumentSectionVersion
   │  └─ (rendered) ContentBlob (optional)
   ├─ ChangeSet
   │  └─ ProposedSectionChange
   ├─ ChatThread
   │  └─ ChatMessage
   ├─ Epic
   │  └─ Story
   ├─ RoadmapItem
   ├─ AssumptionRisk
   ├─ EmbeddingChunk
   └─ AiRun
```


---

## 3. Tables

## 3.0 ER Diagram

```mermaid
erDiagram
  USER {
    int id PK
    string email UK
    string name
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  PROJECT {
    int id PK
    int ownerId FK
    string name
    string description
    enum status
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  PROJECT_MEMBER {
    int id PK
    int projectId FK
    int userId FK
    string role
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  DOCUMENT {
    int id PK
    int projectId FK
    enum type
    string title
    int latestVersion
    int currentBlobId FK
    int lastChangeSetId FK
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  DOCUMENT_SECTION {
    int id PK
    int projectId FK
    int documentId FK
    string key
    string title
    enum type
    int sortOrder
    int currentBlobId FK
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  DOCUMENT_VERSION {
    int id PK
    int projectId FK
    int documentId FK
    int versionNumber
    string message
    int contentBlobId FK
    int changeSetId FK
    int sourceAiRunId FK
    int createdBy FK
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int updatedBy FK
    int deletedBy FK
  }
  DOCUMENT_SECTION_VERSION {
    int id PK
    int projectId FK
    int documentVersionId FK
    int sectionId FK
    int contentBlobId FK
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  CONTENT_BLOB {
    int id PK
    enum provider
    enum kind
    text textContent
    string storageKey
    string contentType
    int sizeBytes
    string sha256
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  CHANGE_SET {
    int id PK
    int projectId FK
    string title
    string message
    enum status
    int createdBy FK
    int sourceAiRunId FK
    timestamp createdAt
    timestamp committedAt
    timestamp updatedAt
    timestamp deletedAt
    int updatedBy FK
    int deletedBy FK
  }
  PROPOSED_SECTION_CHANGE {
    int id PK
    int changeSetId FK
    int documentId FK
    int sectionId FK
    int proposedBlobId FK
    int diffBlobId FK
    string summary
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  CHAT_THREAD {
    int id PK
    int projectId FK
    enum scope
    int documentId FK
    string title
    int createdBy FK
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int updatedBy FK
    int deletedBy FK
  }
  CHAT_MESSAGE {
    int id PK
    int threadId FK
    enum role
    int contentBlobId FK
    int aiRunId FK
    int changeSetId FK
    int createdBy FK
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int updatedBy FK
    int deletedBy FK
  }
  EPIC {
    int id PK
    int projectId FK
    string title
    string description
    int sortOrder
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  STORY {
    int id PK
    int projectId FK
    int epicId FK
    string title
    string description
    int priority
    int points
    enum status
    int sortOrder
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  ROADMAP_ITEM {
    int id PK
    int projectId FK
    string title
    string description
    date startDate
    date endDate
    string quarter
    enum status
    int sortOrder
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  ASSUMPTION_RISK {
    int id PK
    int projectId FK
    enum type
    string title
    text detail
    enum confidence
    enum status
    int documentId
    int epicId
    int storyId
    int roadmapItemId
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }
  AI_RUN {
    int id PK
    int projectId FK
    enum type
    string model
    int promptBlobId FK
    json inputJson
    json outputJson
    int tokensIn
    int tokensOut
    int createdBy FK
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int updatedBy FK
    int deletedBy FK
  }
  EMBEDDING_CHUNK {
    int id PK
    int projectId FK
    int documentId
    int sectionId
    string sourceType
    string sourceId
    int chunkIndex
    int contentBlobId FK
    string contentHash
    int version
    timestamp createdAt
    timestamp updatedAt
    timestamp deletedAt
    int createdBy FK
    int updatedBy FK
    int deletedBy FK
  }

  USER ||--o{ PROJECT : "owns"
  PROJECT ||--o{ PROJECT_MEMBER : "has"
  PROJECT_MEMBER }o--|| USER : "joined by"
  PROJECT ||--o{ DOCUMENT : "has"
  DOCUMENT ||--o{ DOCUMENT_SECTION : "has"
  DOCUMENT ||--o{ DOCUMENT_VERSION : "versions"
  DOCUMENT_VERSION ||--o{ DOCUMENT_SECTION_VERSION : "includes"
  CONTENT_BLOB ||--o{ DOCUMENT : "rendered as"
  CONTENT_BLOB ||--o{ DOCUMENT_SECTION : "current content"
  CONTENT_BLOB ||--o{ DOCUMENT_VERSION : "snapshot"
  CONTENT_BLOB ||--o{ DOCUMENT_SECTION_VERSION : "snapshot"
  PROJECT ||--o{ CHANGE_SET : "has"
  CHANGE_SET ||--o{ PROPOSED_SECTION_CHANGE : "proposes"
  CONTENT_BLOB ||--o{ PROPOSED_SECTION_CHANGE : "proposed/diff"
  PROJECT ||--o{ CHAT_THREAD : "has"
  CHAT_THREAD ||--o{ CHAT_MESSAGE : "has"
  CONTENT_BLOB ||--o{ CHAT_MESSAGE : "content"
  PROJECT ||--o{ EPIC : "has"
  EPIC ||--o{ STORY : "has"
  PROJECT ||--o{ ROADMAP_ITEM : "has"
  PROJECT ||--o{ ASSUMPTION_RISK : "has"
  PROJECT ||--o{ AI_RUN : "has"
  PROJECT ||--o{ EMBEDDING_CHUNK : "has"
  %% EMBEDDING_CHUNK links via (sourceType, sourceId)
```

---

## 3.1 User

**Purpose**  
Represents a system user and project owner.

**Fields**
- `id` (PK, incremental)
- `email` (unique)
- `name`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

---

## 3.2 Project

**Purpose**  
Top-level container for all documents and planning data.

**Fields**
- `id` (PK, incremental)
- `ownerId` (FK → User)
- `name`
- `description`
- `status` (`DRAFT | ACTIVE | ARCHIVED`)
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

**Indexes**
- `(ownerId, createdAt)`

---

## 3.3 Document

**Purpose**  
Stores canonical project documents; rendered content is stored via `ContentBlob`. Versioning and edits operate at both document and section levels.

**Document Types**
- `PROJECT_BRIEF`
- `SCOPE_FEATURES`
- `EPICS`
- `USER_STORIES`
- `ROADMAP`
- `ASSUMPTIONS_RISKS`

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `type` (enum)
- `title`
- `latestVersion` (int)
- `currentBlobId` (FK → ContentBlob)
- `lastChangeSetId` (FK → ChangeSet)
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

**Rules**
- Exactly one document per type per project

**Constraints**
- `UNIQUE (projectId, type)`

---

## 3.4 Epic

**Purpose**  
High-level deliverables derived from product scope (ordered list).

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `title`
- `description`
- `sortOrder` (int)
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

**Constraints**
- `UNIQUE (projectId, code)`

---

## 3.5 Story

**Purpose**  
Actionable work items linked to epics; simple prioritization and ordering.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `epicId` (FK → Epic)
- `title`
- `description`
- `priority` (int; 0–3 typical)
- `points`
- `status` (`PLANNED | IN_PROGRESS | DONE | BLOCKED`)
- `sortOrder` (int)
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

**Constraints**
- `UNIQUE (projectId, code)`

---

## 3.6 RoadmapItem

**Purpose**  
Represents time-based planning units (optionally by quarter) with ordering.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `title`
- `description`
- `startDate`
- `endDate`
- `quarter`
- `status` (`PLANNED | IN_PROGRESS | DONE | BLOCKED`)
- `sortOrder` (int)
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

---

## 3.7 AssumptionRisk

**Purpose**  
Tracks assumptions and risks across the project.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `type` (`ASSUMPTION | RISK`)
- `title`
- `detail`
- `confidence` (`LOW | MEDIUM | HIGH`)
- `status` (`OPEN | MITIGATED | CLOSED`)
- Optional links:
  - `documentId`
  - `epicId`
  - `storyId`
  - `roadmapItemId`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

---

## 3.8 AiRun

**Purpose**  
Audit log for AI-generated content.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `type` (`GENERATE_PROJECT | CHAT_EDIT | REGENERATE_SECTION`)
- `model`
- `promptBlobId` (FK → ContentBlob)
- `inputJson` (JSON)
- `outputJson` (JSON)
- `tokensIn`
- `tokensOut`
- `createdBy` (FK → User)
- `createdAt`
- `updatedAt`
- `deletedAt`
- `updatedBy`
- `deletedBy`

**Usage**
- Linked from Document, Epic, Story, RoadmapItem
- Enables traceability and debugging

---

## 3.9 ProjectMember

**Purpose**  
Associates users to projects with a flexible role.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `userId` (FK → User)
- `role` (string; e.g., `MEMBER`, flexible for future roles)
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

**Constraints**
- `UNIQUE (projectId, userId)`

**Indexes**
- `(userId)`

---

## 3.10 ContentBlob

**Purpose**  
Storage abstraction for content (Markdown/JSON/diff), supporting Postgres or external blob storage (e.g., R2).

**Fields**
- `id` (PK, incremental)
- `provider` (`POSTGRES | R2`)
- `kind` (`MARKDOWN | JSON | DIFF`)
- `textContent` (when provider = POSTGRES)
- `storageKey` (when provider = R2)
- `contentType` (e.g., `text/markdown`, `application/json`)
- `sizeBytes`
- `sha256`
- `createdAt`
- `updatedAt`
- `deletedAt`
- `createdBy`
- `updatedBy`
- `deletedBy`

**Indexes**
- `(provider)`, `(sha256)`

---

## 3.11 DocumentSection

**Purpose**  
Addresses and organizes sub-parts of a document for targeted AI edits and diffs.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `documentId` (FK → Document)
- `key` (stable identifier; e.g., `brief.problem`)
- `title` (optional)
- `type` (`HEADING | PARAGRAPH | LIST | TABLE | CODE | CALLOUT`)
- `sortOrder` (int)
- `currentBlobId` (FK → ContentBlob)
- `createdAt`, `updatedAt`
- `deletedAt`
- `createdBy`, `updatedBy`, `deletedBy`

**Constraints**
- `UNIQUE (documentId, key)`

**Indexes**
- `(documentId, sortOrder)`, `(projectId)`

---

## 3.12 DocumentVersion

**Purpose**  
Immutable snapshot representing an applied change to a document.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `documentId` (FK → Document)
- `versionNumber` (int)
- `message`
- `contentBlobId` (FK → ContentBlob; rendered doc at that version)
- `changeSetId` (FK → ChangeSet)
- `sourceAiRunId` (FK → AiRun)
- `createdBy` (FK → User)
- `createdAt`, `updatedAt`, `deletedAt`
- `updatedBy`, `deletedBy`

**Constraints**
- `UNIQUE (documentId, versionNumber)`

**Indexes**
- `(projectId, createdAt)`, `(changeSetId)`

---

## 3.13 DocumentSectionVersion

**Purpose**  
Stores only the sections that changed within a `DocumentVersion`.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `documentVersionId` (FK → DocumentVersion)
- `sectionId` (FK → DocumentSection)
- `contentBlobId` (FK → ContentBlob)
- `createdAt`, `updatedAt`, `deletedAt`
- `createdBy`, `updatedBy`, `deletedBy`

**Constraints**
- `UNIQUE (documentVersionId, sectionId)`

**Indexes**
- `(sectionId)`

---

## 3.14 ChangeSet

**Purpose**  
Commit-like grouping of updates across one or more documents/sections.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `title`
- `message`
- `status` (`PROPOSED | COMMITTED | DISCARDED`)
- `createdAt`, `committedAt`
- `createdBy` (FK → User)
- `sourceAiRunId` (FK → AiRun)
- `updatedAt`, `deletedAt`
- `updatedBy`, `deletedBy`

**Indexes**
- `(projectId, createdAt)`, `(status)`

---

## 3.15 ProposedSectionChange

**Purpose**  
Holds proposed content and optional diff for preview before applying to create versions.

**Fields**
- `id` (PK, incremental)
- `changeSetId` (FK → ChangeSet)
- `documentId` (FK → Document)
- `sectionId` (FK → DocumentSection)
- `proposedBlobId` (FK → ContentBlob)
- `diffBlobId` (FK → ContentBlob)
- `summary`
- `createdAt`, `updatedAt`, `deletedAt`
- `createdBy`, `updatedBy`, `deletedBy`

**Constraints**
- `UNIQUE (changeSetId, sectionId)`

**Indexes**
- `(documentId)`, `(sectionId)`

---

## 3.16 ChatThread

**Purpose**  
Project-scoped or document-scoped chat threads that may produce proposed changes.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `scope` (`PROJECT | DOCUMENT`)
- `documentId` (FK → Document)
- `title`
- `createdBy` (FK → User)
- `createdAt`, `updatedAt`, `deletedAt`
- `updatedBy`, `deletedBy`

**Indexes**
- `(projectId, updatedAt)`, `(documentId)`

---

## 3.17 ChatMessage

**Purpose**  
Messages within a thread, with content stored via `ContentBlob`, optionally linked to `AiRun` or `ChangeSet`.

**Fields**
- `id` (PK, incremental)
- `threadId` (FK → ChatThread)
- `role` (`USER | ASSISTANT | SYSTEM`)
- `contentBlobId` (FK → ContentBlob)
- `aiRunId` (FK → AiRun)
- `changeSetId` (FK → ChangeSet)
- `createdBy` (FK → User)
- `createdAt`, `updatedAt`, `deletedAt`
- `updatedBy`, `deletedBy`

**Indexes**
- `(threadId, createdAt)`, `(aiRunId)`, `(changeSetId)`

---

## 4. Vector Database Design (pgvector)

**Technology**
- Postgres + `pgvector`

**Purpose**
- Semantic search
- Project-scoped AI chat
- Consistency checks
- Impact analysis

---

## 4.1 EmbeddingChunk

**Purpose**  
Stores vector embeddings for semantic retrieval.

**Fields**
- `id` (PK, incremental)
- `projectId` (FK → Project)
- `documentId` (optional)
- `sectionId` (optional)
- `sourceType` (string; e.g., `Document`, `Section`, `Epic`, `Story`)
- `sourceId` (optional ID of source entity)
- `chunkIndex` (int)
- `contentBlobId` (FK → ContentBlob)
- `contentHash` (string)
- `version` (integer)
- `createdAt`, `updatedAt`, `deletedAt`
- `createdBy`, `updatedBy`, `deletedBy`

**Rules**
- Only embed meaningful text
- Re-embed only if `contentHash` changes
- Always filter by `projectId` during retrieval

---

## 5. Data Consistency Rules

- Documents derive from Project Brief
- Epics must map to exactly one feature (conceptually)
- Stories must map to exactly one epic
- Roadmap items must reference existing epics
- AI output must be validated before persistence
- Vector embeddings must stay in sync with source content
- Document versions must correspond to applied ChangeSets
- Section versions must correspond to changed sections only

---

## 6. MVP Scope Summary

**Included**
- Project
- Documents (Markdown)
- Epics
- Stories
- Roadmap
- Assumptions/Risks
- AI audit logging
- Vector embeddings

**Excluded (for now)**
- Team collaboration
- Permissions/roles
- Comments
- External integrations
- Analytics

---

## 7. Why This Design Works

- Simple enough for MVP
- Structured enough for AI
- Traceable and debuggable
- Easy to extend without breaking existing data
- Compatible with Prisma + pgvector

---

This document is the **canonical database reference** for the Prism MVP.