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
  // Avoid duplicates by collapsing on (epicId,title) and linking to existing ids
  const existing = await storyRepo.list(projectId);
  const keyOf = (epicId: number | null, title: string) => `${epicId ?? 0}|${title.trim().toLowerCase()}`;
  const existingMap = new Map<string, number>();
  for (const s of existing as Array<{ id: number; epicId: number | null; title: string }>) {
    existingMap.set(keyOf(s.epicId ?? null, s.title), s.id);
  }
  const normalized = normalizeStoriesForSave(items as unknown[]);
  const seen = new Set<string>();
  const deduped: StoryUpsertInput[] = [];
  for (const it of normalized) {
    const key = keyOf(it.epicId ?? null, it.title);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!it.id && existingMap.has(key)) it.id = existingMap.get(key);
    deduped.push(it);
  }
  const rows = await storyRepo.bulkUpsert(projectId, deduped);
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
  const epics = await epicRepo.list(projectId);
  const rows = await roadmapRepo.bulkUpsert(projectId, normalizeRoadmapForSave(items as unknown[], epics));
  return { items: rows };
}

export async function generateRoadmap(projectId: number, payload: {
  name: string;
  strictness?: 'normal'|'strict';
  model?: string;
  temperature?: number;
  top_p?: number;
  cadence?: 'weekly'|'monthly'|'quarterly';
  horizonMonths?: number;
  startDate?: string;
  maxItemsPerPeriod?: number;
  notes?: string;
  teamSize?: number;
  workDaysPerWeek?: number;
  velocityPointsPerSprint?: number;
  avgStoryPoints?: number;
  avgEpicPoints?: number;
  includeStorySchedule?: boolean;
  holidayDatesCsv?: string;
  releaseMilestones?: string;
}) {
  const system = (await loadTemplate('system/default.yml')).template;
  const rubric = (await loadTemplate('rubrics/roadmap.yml')).template;
  const brief = await docRepo.getByType(projectId, 'PROJECT_BRIEF');
  const scope = await docRepo.getByType(projectId, 'PROJECT_SCOPE');
  const epics = await epicRepo.list(projectId);
  const stories = await storyRepo.list(projectId);
  const prompt = await buildPromptFromTemplate('tasks/generate_roadmap.yml', {
    system,
    rubric,
    name: payload.name,
    brief: brief?.contentMd ?? '',
    scope: scope?.contentMd ?? '',
    epics: JSON.stringify(epics.map(e => ({ id: e.id, title: e.title, priority: e.priority, status: e.status })) ),
    stories_meta: JSON.stringify(stories.map(s => ({ id: s.id, epicId: s.epicId, title: s.title, priority: s.priority, status: s.status })) ),
    cadence: payload.cadence ?? 'quarterly',
    horizon_months: String(payload.horizonMonths ?? 6),
    start_date: payload.startDate ?? '',
    max_items_per_period: payload.maxItemsPerPeriod != null ? String(payload.maxItemsPerPeriod) : '',
    notes: payload.notes ?? '',
    team_size: payload.teamSize != null ? String(payload.teamSize) : '',
    work_days_per_week: payload.workDaysPerWeek != null ? String(payload.workDaysPerWeek) : '',
    velocity_points_per_sprint: payload.velocityPointsPerSprint != null ? String(payload.velocityPointsPerSprint) : '',
    avg_story_points: payload.avgStoryPoints != null ? String(payload.avgStoryPoints) : '',
    avg_epic_points: payload.avgEpicPoints != null ? String(payload.avgEpicPoints) : '',
    include_story_schedule: payload.includeStorySchedule ? 'yes' : 'no',
    holidays_csv: payload.holidayDatesCsv ?? '',
    release_milestones: payload.releaseMilestones ?? '',
    strictness: payload.strictness ?? 'normal',
  });
  const resp = await ai.generateText({
    model: payload.model ?? 'google/gemini-2.5-flash-lite',
    prompt,
    temperature: payload.temperature ?? 0.5,
    topP: payload.top_p ?? 0.9,
  });
  const json = parseJsonFromText(resp.text);
  // Try to persist dates for epics/stories if provided
  try {
    const parsed = json as unknown as { items?: unknown[]; epics?: unknown[]; stories?: unknown[] };
    const itemsFromAi = Array.isArray(parsed?.items) ? parsed.items : [];
    const epicsFromAiRaw = Array.isArray(parsed?.epics) ? parsed.epics : [];
    const storiesFromAiRaw = Array.isArray(parsed?.stories) ? parsed.stories : [];

    // Helpers
    const parseDate = (v: unknown): Date | null => {
      if (typeof v !== 'string') return null;
      const iso = new Date(v);
      if (!isNaN(iso.getTime())) return iso;
      // Fallback MM/DD/YYYY
      const parts = v.split('/');
      if (parts.length === 3) {
        const d = new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
        return isNaN(d.getTime()) ? null : d;
      }
      return null;
    };
    const toIso = (d: Date | null): string | null => (d ? new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString() : null);
    const clamp = (d: Date, start: Date, end: Date): Date => {
      if (d < start) return start;
      if (d > end) return end;
      return d;
    };

    // Persist milestones "items" as-is (UI already auto-saves, but we keep returning them)
    const itemsWindows: Array<{ start: Date; end: Date }> = [];
    for (const it of itemsFromAi as Array<Record<string, unknown>>) {
      const s = parseDate(it.startDate ?? (it as Record<string, unknown>).start_date ?? it.start);
      const e = parseDate(it.endDate ?? (it as Record<string, unknown>).end_date ?? it.end);
      if (s && e && e >= s) itemsWindows.push({ start: s, end: e });
    }

    // Normalize epics windows: prefer AI dates; otherwise distribute across milestones
    const existingEpics = await epicRepo.list(projectId);
    const existingEpicIds = new Set<number>((existingEpics as Array<{ id: number }>).map((e) => e.id));
    const epicUpserts: EpicUpsertInput[] = [];
    const epicsFromAi = epicsFromAiRaw.map((e) => e as Record<string, unknown>);
    if (epicsFromAi.length > 0 || itemsWindows.length > 0) {
      const orderedEpics = existingEpics as Array<{ id: number; title: string }>;
      let milestoneIdx = 0;
      for (const e of orderedEpics) {
        const ai = epicsFromAi.find((x) => String(x.title ?? '').trim().toLowerCase() === e.title.trim().toLowerCase());
        let s = ai ? parseDate(ai.startDate ?? (ai as Record<string, unknown>).start_date ?? ai.start) : null;
        let en = ai ? parseDate(ai.endDate ?? (ai as Record<string, unknown>).end_date ?? ai.end) : null;
        if ((!s || !en || en < s) && itemsWindows.length > 0) {
          const w = itemsWindows[milestoneIdx % itemsWindows.length];
          milestoneIdx++;
          s = w.start;
          en = w.end;
        }
        epicUpserts.push({
          id: e.id,
          title: e.title,
          startDate: toIso(s),
          endDate: toIso(en),
        });
      }
      await epicRepo.bulkUpsert(projectId, epicUpserts);
    }

    // Normalize stories: clamp within epic windows and backfill evenly if missing
    if (storiesFromAiRaw.length > 0) {
      const storyUpserts: StoryUpsertInput[] = [];
      const epicIdToWindow = new Map<number, { start: Date; end: Date }>();
      const epicsAfter = (await epicRepo.list(projectId)) as Array<{ id: number; startDate?: string | null; endDate?: string | null }>;
      for (const e of epicsAfter) {
        const s = parseDate(e.startDate ?? null);
        const en = parseDate(e.endDate ?? null);
        if (s && en && en >= s) epicIdToWindow.set(e.id, { start: s, end: en });
      }
      // Group by epic
      const byEpic = new Map<number, Array<Record<string, unknown>>>();
      for (const s of storiesFromAiRaw as Array<Record<string, unknown>>) {
        const epicId = typeof s.epicId === 'number' ? (s.epicId as number) : undefined;
        if (!epicId || !existingEpicIds.has(epicId)) continue;
        if (!byEpic.has(epicId)) byEpic.set(epicId, []);
        byEpic.get(epicId)!.push(s);
      }
      for (const [epicId, list] of byEpic.entries()) {
        const win = epicIdToWindow.get(epicId);
        if (!win) continue;
        const count = list.length || 1;
        const totalMs = Math.max(1, win.end.getTime() - win.start.getTime());
        const slice = Math.floor(totalMs / count);
        list.forEach((s, idx) => {
          let st = parseDate(s.startDate ?? (s as Record<string, unknown>).start_date ?? s.start);
          let en = parseDate(s.endDate ?? (s as Record<string, unknown>).end_date ?? s.end);
          if (!st || !en || en < st) {
            st = new Date(win.start.getTime() + idx * slice);
            en = new Date(Math.min(win.end.getTime(), st.getTime() + Math.max(slice, 24 * 60 * 60 * 1000)));
          } else {
            st = clamp(st, win.start, win.end);
            en = clamp(en, win.start, win.end);
          }
          storyUpserts.push({
            id: typeof s.id === 'number' ? (s.id as number) : undefined,
            epicId,
            title: String(s.title ?? ''),
            startDate: toIso(st),
            endDate: toIso(en),
          });
        });
      }
      if (storyUpserts.length > 0) await storyRepo.bulkUpsert(projectId, storyUpserts);
    }
  } catch {}

  // Fallback: if no dates provided, generate a simple sequential schedule
  const items = (json as unknown as { items?: RoadmapUpsertInput[] })?.items;
  if (!items || items.length === 0) {
    const start = payload.startDate ? new Date(payload.startDate) : new Date();
    const stepMonths = payload.cadence === 'weekly' ? 0.25 : payload.cadence === 'monthly' ? 1 : 3;
    const epics = await epicRepo.list(projectId);
    const out: RoadmapUpsertInput[] = [];
    let cursor = new Date(start);
    for (const e of epics) {
      const s = new Date(cursor);
      const end = new Date(s);
      end.setMonth(end.getMonth() + (stepMonths || 1));
      out.push({ title: e.title, epicId: e.id, startDate: s.toISOString(), endDate: end.toISOString(), status: 'PLANNED' });
      cursor = new Date(end);
    }
    return { items: out };
  }

  return json as { items: RoadmapUpsertInput[] };
}

function normalizeRoadmapForSave(items: unknown[], epics?: Array<{ id: number; title: string }>): RoadmapUpsertInput[] {
  const titleToEpicId = new Map<string, number>();
  if (Array.isArray(epics)) {
    for (const e of epics) {
      titleToEpicId.set((e.title ?? '').trim().toLowerCase(), e.id);
    }
  }
  const resolveEpicId = (it: Record<string, unknown>): number | null => {
    // Accept epicId directly
    if (typeof it.epicId === 'number') return it.epicId;
    if (typeof it.epicId === 'string' && /^\d+$/.test(it.epicId)) return Number.parseInt(it.epicId, 10);
    // Try epic title fields
    const candidates = [
      it.epicTitle, it.epic_title, it.epic, it.epic_name, it.epicName,
    ].filter((v) => typeof v === 'string') as string[];
    for (const name of candidates) {
      const key = name.trim().toLowerCase();
      if (titleToEpicId.has(key)) return titleToEpicId.get(key)!;
    }
    return null;
  };
  const coerceDate = (v: unknown): string | null => {
    if (typeof v === 'string') {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    if (v instanceof Date) return isNaN(v.getTime()) ? null : v.toISOString();
    return null;
  };
  return (items ?? []).map((raw) => {
    const it = (raw ?? {}) as Record<string, unknown>;
    const id =
      typeof it.id === 'number'
        ? it.id
        : (typeof it.id === 'string' && /^\d+$/.test(it.id)) ? Number.parseInt(it.id, 10) : undefined;
    const epicId = resolveEpicId(it);
    const startDate =
      coerceDate((it as Record<string, unknown>).startDate) ??
      coerceDate((it as Record<string, unknown>).start_date) ??
      coerceDate((it as Record<string, unknown>).start);
    const endDate =
      coerceDate((it as Record<string, unknown>).endDate) ??
      coerceDate((it as Record<string, unknown>).end_date) ??
      coerceDate((it as Record<string, unknown>).end);
    return {
      id,
      title: String(it.title ?? '').trim(),
      description: typeof it.description === 'string' ? it.description : null,
      target: typeof it.target === 'string' ? it.target : null,
      startDate,
      endDate,
      epicId,
      priority: typeof it.priority === 'string' ? it.priority : null,
      status: typeof it.status === 'string' ? it.status : null,
    };
  });
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


