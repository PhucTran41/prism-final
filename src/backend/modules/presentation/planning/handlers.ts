import { EpicPrismaRepo, type EpicUpsertInput } from '@/src/backend/modules/infrastructure/planning/prisma/epicRepo';
import { StoryPrismaRepo, type StoryUpsertInput } from '@/src/backend/modules/infrastructure/planning/prisma/storyRepo';
import { RoadmapPrismaRepo, type RoadmapUpsertInput } from '@/src/backend/modules/infrastructure/planning/prisma/roadmapRepo';
import { buildPromptFromTemplate, loadTemplate } from '@/src/backend/ai';
import { AiSdkService } from '@/src/backend/modules/infrastructure/ai/aiSdkService';
import { DocumentPrismaRepo } from '@/src/backend/modules/infrastructure/document/prisma/repo';

const ai = new AiSdkService();
const epicRepo = new EpicPrismaRepo();
const storyRepo = new StoryPrismaRepo();
const roadmapRepo = new RoadmapPrismaRepo();
const docRepo = new DocumentPrismaRepo();

function parseJsonFromText(text: string): unknown {
  let src = (text ?? '').trim();
  // Prefer fenced JSON block if present
  const fenced = src.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    src = fenced[1].trim();
  } else if (!src.startsWith('{') && !src.startsWith('[')) {
    // Try to slice from first { to last }
    const start = src.indexOf('{');
    const end = src.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      src = src.slice(start, end + 1);
    }
  }
  return JSON.parse(src);
}

export async function listEpics(projectId: number) {
  const rows = await epicRepo.list(projectId);
  return { epics: rows };
}

export async function saveEpics(projectId: number, items: EpicUpsertInput[]) {
  const rows = await epicRepo.bulkUpsert(projectId, items);
  return { epics: rows };
}

export async function generateEpics(projectId: number, payload: { name: string; strictness?: 'normal'|'strict'; model?: string; temperature?: number; top_p?: number }) {
  const system = (await loadTemplate('system/default.yml')).template;
  const rubric = (await loadTemplate('rubrics/epics.yml')).template;
  const brief = await docRepo.getByType(projectId, 'PROJECT_BRIEF');
  const scope = await docRepo.getByType(projectId, 'PROJECT_SCOPE');
  const prompt = await buildPromptFromTemplate('tasks/generate_epics.yml', {
    system,
    rubric,
    name: payload.name,
    brief: brief?.contentMd ?? '',
    scope: scope?.contentMd ?? '',
    strictness: payload.strictness ?? 'normal',
  });
  const resp = await ai.generateText({
    model: payload.model ?? 'google/gemini-2.5-flash-lite',
    prompt,
    temperature: payload.temperature ?? 0.5,
    topP: payload.top_p ?? 0.9,
  });
  const json = parseJsonFromText(resp.text);
  return json as { epics: EpicUpsertInput[] };
}

export async function listStories(projectId: number) {
  const rows = await storyRepo.list(projectId);
  return { stories: rows };
}

export async function saveStories(projectId: number, items: StoryUpsertInput[]) {
  const rows = await storyRepo.bulkUpsert(projectId, normalizeStoriesForSave(items as unknown[]));
  return { stories: rows };
}

export async function generateStories(projectId: number, payload: { name: string; epicTitles?: string[]; strictness?: 'normal'|'strict'; model?: string; temperature?: number; top_p?: number }) {
  const system = (await loadTemplate('system/default.yml')).template;
  const rubric = (await loadTemplate('rubrics/stories.yml')).template;
  const brief = await docRepo.getByType(projectId, 'PROJECT_BRIEF');
  const scope = await docRepo.getByType(projectId, 'PROJECT_SCOPE');
  const prompt = await buildPromptFromTemplate('tasks/generate_stories.yml', {
    system,
    rubric,
    name: payload.name,
    brief: brief?.contentMd ?? '',
    scope: scope?.contentMd ?? '',
    epic_titles: (payload.epicTitles ?? []).join(', '),
    strictness: payload.strictness ?? 'normal',
  });
  const resp = await ai.generateText({
    model: payload.model ?? 'google/gemini-2.5-flash-lite',
    prompt,
    temperature: payload.temperature ?? 0.6,
    topP: payload.top_p ?? 0.9,
  });
  const json = parseJsonFromText(resp.text);
  return json as { stories: StoryUpsertInput[] };
}

export async function listRoadmap(projectId: number) {
  const rows = await roadmapRepo.list(projectId);
  return { items: rows };
}

export async function saveRoadmap(projectId: number, items: RoadmapUpsertInput[]) {
  const rows = await roadmapRepo.bulkUpsert(projectId, items);
  return { items: rows };
}

export async function generateRoadmap(projectId: number, payload: { name: string; strictness?: 'normal'|'strict'; model?: string; temperature?: number; top_p?: number }) {
  const system = (await loadTemplate('system/default.yml')).template;
  const rubric = (await loadTemplate('rubrics/roadmap.yml')).template;
  const brief = await docRepo.getByType(projectId, 'PROJECT_BRIEF');
  const scope = await docRepo.getByType(projectId, 'PROJECT_SCOPE');
  const prompt = await buildPromptFromTemplate('tasks/generate_roadmap.yml', {
    system,
    rubric,
    name: payload.name,
    brief: brief?.contentMd ?? '',
    scope: scope?.contentMd ?? '',
    strictness: payload.strictness ?? 'normal',
  });
  const resp = await ai.generateText({
    model: payload.model ?? 'google/gemini-2.5-flash-lite',
    prompt,
    temperature: payload.temperature ?? 0.5,
    topP: payload.top_p ?? 0.9,
  });
  const json = parseJsonFromText(resp.text);
  return json as { items: RoadmapUpsertInput[] };
}

function normalizeStoriesForSave(items: unknown[]): StoryUpsertInput[] {
  const toStatus = (v: unknown): 'PLANNED'|'IN_PROGRESS'|'DONE'|null => {
    const s = String(v ?? '').toUpperCase();
    if (s === 'PLANNED' || s === 'IN_PROGRESS' || s === 'DONE') return s;
    return null;
  };
  const toPriority = (v: unknown): 'M'|'S'|'C'|null => {
    const s = String(v ?? '').toUpperCase();
    if (s === 'M' || s === 'S' || s === 'C') return s;
    return null;
  };
  return (items ?? []).map((raw) => {
    const it = (raw ?? {}) as Record<string, unknown>;
    const acceptanceRaw = it.acceptance;
    const acceptance =
      Array.isArray(acceptanceRaw)
        ? (acceptanceRaw as unknown[])
            .map((x) => String(x ?? '').trim())
            .filter(Boolean)
            .map((x) => `- ${x}`)
            .join('\n')
        : (typeof acceptanceRaw === 'string' ? acceptanceRaw : null);
    const epicIdRaw = it.epicId;
    const epicId =
      typeof epicIdRaw === 'number'
        ? epicIdRaw
        : (typeof epicIdRaw === 'string' && /^\d+$/.test(epicIdRaw))
          ? Number.parseInt(epicIdRaw, 10)
          : null;
    const idRaw = it.id;
    const id =
      typeof idRaw === 'number'
        ? idRaw
        : (typeof idRaw === 'string' && /^\d+$/.test(idRaw))
          ? Number.parseInt(idRaw, 10)
          : undefined;
    return {
      id,
      epicId,
      title: String(it.title ?? '').trim(),
      description: typeof it.description === 'string' ? it.description : null,
      acceptance,
      priority: toPriority(it.priority),
      status: toStatus(it.status),
    };
  });
}


