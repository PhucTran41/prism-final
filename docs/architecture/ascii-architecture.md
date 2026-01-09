# Prism — Architecture (Pure Markdown Diagram)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                Internet                                    │
│                                                                            │
│  Browser (Next.js UI)                                                      │
│   • SWR/Fetch, SSE reader                                                  │
│   • Tailwind, shadcn/ui                                                    │
└────────────────────────────────────────────────────────────────────────────┘
                                     │ HTTPS
                                     ▼
┌─────────────────────────────── Vercel ─────────────────────────────────────┐
│                                                                            │
│  Vercel Edge Network (CDN)                                                 │
│   • Static asset caching (Next.js)                                         │
│   • Optional Edge Middleware (auth redirect hints)                         │
│                                                                            │
│  Vercel Functions (Next.js App Router)                                     │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                                                                      │  │
│  │  ┌──────────────────────┐    ┌──────────────────────┐                │  │
│  │  │ API Gateway (Routes) │    │ Chat Orchestrator    │                │  │
│  │  │ • All route handlers │    │ • SSE streamText     │                │  │
│  │  │ • Auth/Zod guards    │    │ • Proposal gating    │                │  │
│  │  └──────────────────────┘    └──────────────────────┘                │  │
│  │          │                           │                               │  │
│  │  ┌──────────────────────┐    ┌──────────────────────┐                │  │
│  │  │ Document Service     │    │ Planning Service     │                │  │
│  │  │ • Brief/Scope/Risks  │    │ • Epics/Stories      │                │  │
│  │  │ • Export md/pdf/docx │    │ • Roadmap (Gantt)    │                │  │
│  │  └──────────────────────┘    └──────────────────────┘                │  │
│  │                                                                      │  │
│  │  Runtime notes:                                                       │  │
│  │   • Chat stream runs as Node.js serverless fn for stable SSE          │  │
│  │   • Other routes can be Edge/Node depending on needs                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                         OAuth (Google) for NextAuth

Data layer and external services
--------------------------------
┌───────────────────────────────┐    ┌─────────────────────────────────────┐
│ PostgreSQL (Prisma)           │    │ Object Storage (S3-compatible)     │
│ • Projects, Documents         │    │ • Optional: exports/artifacts       │
│ • Epics, Stories, Roadmap     │    └─────────────────────────────────────┘
│ • ChatThread, ChatMessage     │
└───────────────────────────────┘
                 ▲
                 │ Prisma
                 │
   ┌───────────────────────────────────────────────────────────────────────┐
   │ Vercel AI Gateway (OpenAI/Gemini via ai-sdk)                          │
   │ • Token streaming to Chat Orchestrator                                │
   └───────────────────────────────────────────────────────────────────────┘

Request paths (Vercel)
----------------------
1) Browser → Vercel Edge Network → Next.js Route Handler (Vercel Function)
2) Route handler delegates to:
   • Chat Orchestrator (SSE): streamText via AI Gateway; writes ChatThread/Message
   • Document Service: upsert Brief/Scope/Risks; export md/pdf/docx (to S3 if needed)
   • Planning Service: generate+save Epics/Stories; save Roadmap
3) All writes/reads via Prisma → PostgreSQL
4) Authentication via NextAuth Google OAuth

Notes
-----
• Chat phase guidance lives in ChatThread.meta; proposals appear on explicit intent or /confirm.
• Stories support debounced auto-save from the Epics/Stories UI.
• Roadmap enforces story dates within epic windows; milestones guide distribution.
```

## Application Modules (from code)

```
Frontend (Next.js App Router)
• (marketing)/: Hero/About/Solution/Service/Testimonials/Contact
• (app)/: protected layout (Header/Sidebar)
  - /projects: list projects
  - /projects/new: create form → redirect to /preview
  - /projects/[id]/preview: choose Chat or Quick-generate
  - /projects/[id]/brief, /scope, /assumptions: documents UI + export
  - /projects/[id]/epics: Jira-like backlog (expand to stories), autosave with debounce
  - /projects/[id]/roadmap: editable Gantt (date-fns)
  - /projects/[id]/chat: ChatGPT-like UI (SSE stream, proposals, phase chips)
```

## API Surfaces (route handlers)

```
/api/projects                  GET (list), POST (create)
/api/projects/[id]             GET, DELETE
/api/projects/[id]/brief       GET, PUT
/api/projects/[id]/brief/generate       POST
/api/projects/[id]/assumptions          GET, PUT
/api/projects/[id]/assumptions/generate POST
/api/projects/[id]/scope/generate       POST
/api/projects/[id]/epics                GET, PUT
/api/projects/[id]/epics/generate       POST
/api/projects/[id]/stories              GET, PUT
/api/projects/[id]/stories/generate     POST
/api/projects/[id]/roadmap/generate     POST

Chat:
/api/projects/[id]/chat/stream          SSE stream (data-delta, data-finish, data-proposals)
/api/projects/[id]/chat/apply           POST (apply proposals)
/api/projects/[id]/chat/threads         GET (list threads)
/api/projects/[id]/chat/threads/[tid]   GET (thread messages)
```

## Backend (handlers & infra)

```
presentation/auth/handlers.ts      → NextAuth options
presentation/project/handlers.ts   → list/create/get/delete projects
presentation/document/handlers.ts  → brief/scope/risks generate/update
presentation/planning/handlers.ts  → epics/stories/roadmap generate/save, autosave normalization
presentation/chat/handlers.ts      → orchestrate (ai sdk), apply (persist), artifacts registry
infrastructure/*/prisma/*Repo.ts   → Prisma repositories
backend/ai/prompts/{tasks,rubrics} → YAML prompt library
```

## Data Model (key tables)

```
User(id,email,...)            Project(id,ownerId,name,description,...)
Document(id,projectId,type,title,contentMd,latestVersion,...)  -- PROJECT_BRIEF/PROJECT_SCOPE/ASSUMPTIONS_RISKS
Epic(id,projectId,title,priority,status,startDate,endDate,...)
Story(id,projectId,epicId,title,acceptance,priority,status,startDate,endDate,...)
RoadmapItem(id,projectId,epicId?,title,startDate,endDate,status,...)
ChatThread(id,projectId,userId,title,visibility,meta,json,...)  ChatMessage(id,threadId,role,content,parts,...)
```

## Cross-cutting

```
• Auth guard redirects unauthenticated users to /login.
• Zod validates all API inputs.
• SSE uses headers: Cache-Control no-transform, X-Accel-Buffering no.
• Client: SWR for fetch/cache; toast feedback; framer-motion for effects.
• Tests: vitest + mocks.
```


