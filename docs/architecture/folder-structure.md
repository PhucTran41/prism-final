# Folder Structure

This document explains the folder structure of the Prism MVP and the responsibility of each major folder.  
The goal is to keep the architecture **simple, predictable, and easy for Cursor to navigate**.

---

## Root structure

```text
prism/
├─ src/
├─ prisma/
├─ public/
├─ docs/
├─ scripts/
├─ tests/
├─ package.json
├─ tsconfig.json
└─ next.config.ts
```

## src/

```text
src/
├─ app/
├─ frontend/
├─ backend/
├─ types/
├─ config/
└─ env.ts
```

### app — Routing layer (Next.js)

**Purpose**
- Defines pages, layouts, and API endpoints
- Acts as the entry point for UI and HTTP requests

**Rules**
- No business logic
- No Prisma queries
- No AI prompt logic

```text
app/
├─ (marketing)/
├─ (app)/
│  ├─ dashboard/
│  ├─ projects/
│  │  └─ [projectId]/
│  │     ├─ docs/
│  │     ├─ roadmap/
│  │     └─ stories/
│  └─ settings/
│
├─ api/
│  ├─ projects/
│  ├─ documents/
│  ├─ epics/
│  ├─ stories/
│  ├─ roadmap/
│  └─ ai/
│
├─ layout.tsx
└─ globals.css
```

### frontend — Frontend logic

**Purpose**
- UI components
- Client-side state and hooks
- API fetchers

**Rules**
- Calls `/api/*` only
- Does not access database directly
- Does not contain AI prompt definitions

```text
frontend/
├─ components/
│  ├─ ui/
│  ├─ layout/
│  └─ common/
│
├─ features/
│  ├─ projects/
│  ├─ documents/
│  ├─ epics/
│  ├─ stories/
│  └─ roadmap/
│
├─ stores/
├─ lib/
└─ index.ts
```

### backend — Backend logic (DDD-lite)

**Purpose**
- Business logic
- AI orchestration
- Data access via Prisma

**Rules**
- No React or browser code
- No Next.js page imports
- All logic is reusable and testable

```text
backend/
├─ modules/
├─ ai/
├─ shared/
└─ index.ts
```

#### modules — Domain modules
Each module represents one business area.

```text
modules/
├─ project/
├─ document/
├─ epic/
├─ story/
└─ roadmap/
```

Cross-module presentation (shared handlers like authentication):

```text
modules/
└─ presentation/
   └─ auth/
      └─ handlers.ts
```

Module structure:

```text
<module>/
├─ domain/
│  ├─ entities/
│  └─ types.ts
│
├─ application/
│  └─ service.ts
│
├─ infrastructure/
│  └─ prisma/
│     └─ repo.ts
│
└─ presentation/
   ├─ handlers.ts
   └─ validators.ts
```

### ai — AI system

**Purpose**
- Centralized AI logic
- YAML-based prompts and rules
- AI SDK execution

```text
ai/
├─ prompts/
│  ├─ system/
│  ├─ templates/
│  ├─ tasks/
│  └─ rubrics/
│
├─ schemas/
├─ loader.ts
├─ runner.ts
└─ index.ts
```

### shared — Shared backend utilities

```text
shared/
├─ domain/
├─ infrastructure/
│  └─ prisma.ts
└─ presentation/
```

## prisma — Database layer

**Purpose**
- Database schema and migrations

```text
prisma/
├─ schema.prisma
└─ seed.ts
```

## docs — Documentation

**Purpose**
- Architecture and developer documentation

```text
docs/
└─ architecture/
   ├─ README.md
   ├─ folder-structure.md
   ├─ data-flow.md
   ├─ database.md
   └─ ai-prompts.md
```

## Architectural rules (summary)

- `app/` handles routing only
- `frontend/` handles UI and client logic
- `backend/` handles business logic and AI
- Prisma access is limited to infrastructure layer
- AI prompts live in YAML files only

This structure is designed to be easy for Cursor to understand, easy to extend, and safe to evolve beyond MVP.


