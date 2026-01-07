import { AiSdkService } from '@/src/backend/modules/infrastructure/ai/aiSdkService';
import { buildPromptFromTemplate, loadTemplate } from '@/src/backend/ai';
import { updateProjectBriefHandler, generateProjectBriefHandler, generateProjectScopeHandler } from '@/src/backend/modules/presentation/document/handlers';
import { generateEpics, saveEpics, generateStories, saveStories, generateRoadmap, saveRoadmap } from '@/src/backend/modules/presentation/planning/handlers';
import { DocumentPrismaRepo } from '@/src/backend/modules/infrastructure/document/prisma/repo';
import { ProjectPrismaRepo } from '@/src/backend/modules/infrastructure/project/prisma/repo';
import { EpicPrismaRepo } from '@/src/backend/modules/infrastructure/planning/prisma/epicRepo';
import { StoryPrismaRepo } from '@/src/backend/modules/infrastructure/planning/prisma/storyRepo';
import { RoadmapPrismaRepo } from '@/src/backend/modules/infrastructure/planning/prisma/roadmapRepo';

const ai = new AiSdkService();
const docRepo = new DocumentPrismaRepo();
const projectRepo = new ProjectPrismaRepo();
const epicRepo = new EpicPrismaRepo();
const storyRepo = new StoryPrismaRepo();
const roadmapRepo = new RoadmapPrismaRepo();

export type ChatMessage = { role: 'user'|'assistant'|'system'; content: string };

export type ChatProposal =
  | { kind: 'brief.update'; payload: { contentMd: string; mode?: 'overwrite'|'newVersion' } }
  | { kind: 'brief.generate'; payload: { name: string; problem?: string; targetUser?: string; goals?: string; constraints?: string } }
  | { kind: 'scope.generate'; payload: { name: string; goals?: string; must?: string; should?: string; could?: string; non_goals?: string } }
  | { kind: 'epics.generate'; payload: { name: string; strictness?: 'normal'|'strict' } }
  | { kind: 'epics.save'; payload: { items: Array<{ id?: number; title: string; priority?: string|null; status?: string|null }> } }
  | { kind: 'stories.generate'; payload: { name: string; epicTitles?: string[]; strictness?: 'normal'|'strict' } }
  | { kind: 'stories.save'; payload: { items: Array<{ id?: number; epicId?: number|null; title: string; acceptance?: string|null; priority?: string|null; status?: string|null; startDate?: string|null; endDate?: string|null }> } }
  | { kind: 'roadmap.generate'; payload: { name: string; cadence?: 'weekly'|'monthly'|'quarterly'; horizonMonths?: number; startDate?: string; teamSize?: number; workDaysPerWeek?: number; velocityPointsPerSprint?: number; includeStorySchedule?: boolean; holidayDatesCsv?: string; releaseMilestones?: string } }
  | { kind: 'roadmap.save'; payload: { items: Array<Record<string, unknown>> } };

export async function chatOrchestrate(projectId: number, messages: ChatMessage[], onDelta?: (delta: string) => void) {
  const system = (await loadTemplate('system/default.yml')).template;
  const rubric = 'Respond with a helpful message AND optional proposals as JSON.\n- If user asks to change data, produce proposals with precise payloads.\n- If only asking, produce just text.\nOutput JSON in a fenced code block with shape: { text: string, proposals?: Array<{ kind: string, payload: object }> }';
  const ctx = await buildProjectContext(projectId);
  const prompt = await buildPromptFromTemplate('tasks/chat_orchestrator.yml', {
    system,
    rubric,
    conversation: messages.map(m => `${m.role}: ${m.content}`).join('\n'),
    user_latest: messages[messages.length - 1]?.content ?? '',
    project_context: JSON.stringify(ctx),
  });
  if (onDelta) {
    const result = await ai.streamGenerateText({
      model: 'google/gemini-2.5-flash-lite',
      prompt,
      temperature: 0.4,
      topP: 0.9,
      onDelta,
    });
    return { raw: result.text };
  } else {
    const result = await ai.generateText({
      model: 'google/gemini-2.5-flash-lite',
      prompt,
      temperature: 0.4,
      topP: 0.9,
    });
    return { raw: result.text };
  }
}

async function buildProjectContext(projectId: number) {
  const project = await projectRepo.getById(projectId);
  const brief = await docRepo.getByType(projectId, 'PROJECT_BRIEF');
  const scope = await docRepo.getByType(projectId, 'PROJECT_SCOPE');
  const epics = (await epicRepo.list(projectId)) as Array<{
    id: number; title: string; priority?: string|null; status?: string|null; startDate?: Date|null; endDate?: Date|null;
  }>;
  const stories = (await storyRepo.list(projectId)) as Array<{
    id: number; epicId: number|null; title: string; priority?: string|null; status?: string|null; startDate?: Date|null; endDate?: Date|null;
  }>;
  const roadmapItems = (await roadmapRepo.list(projectId)) as Array<{
    id: number; title: string; epicId?: number|null; startDate?: Date|null; endDate?: Date|null; status?: string|null;
  }>;
  const truncate = (s?: string|null, n = 2000) => (s ? (s.length > n ? s.slice(0, n) + '\n…' : s) : '');
  return {
    project: {
      id: project?.id ?? projectId,
      name: project?.name ?? 'Project',
      description: truncate(project?.description ?? null, 2000),
      status: (project as unknown as { status?: string })?.status ?? null,
      createdAt: (project as unknown as { createdAt?: Date })?.createdAt ? new Date((project as unknown as { createdAt?: Date })?.createdAt as Date).toISOString() : null,
      updatedAt: (project as unknown as { updatedAt?: Date })?.updatedAt ? new Date((project as unknown as { updatedAt?: Date })?.updatedAt as Date).toISOString() : null,
    },
    brief: truncate(brief?.contentMd ?? null, 3000),
    scope: truncate(scope?.contentMd ?? null, 3000),
    epics: (epics ?? []).map(e => ({
      id: e.id, title: e.title, priority: e.priority ?? null, status: e.status ?? null,
      startDate: e.startDate ? new Date(e.startDate).toISOString() : null,
      endDate: e.endDate ? new Date(e.endDate).toISOString() : null,
    })),
    stories: (stories ?? []).slice(0, 200).map(s => ({
      id: s.id, epicId: s.epicId ?? null, title: s.title, priority: s.priority ?? null, status: s.status ?? null,
      startDate: s.startDate ? new Date(s.startDate).toISOString() : null,
      endDate: s.endDate ? new Date(s.endDate).toISOString() : null,
    })),
    roadmap: (roadmapItems ?? []).map(r => ({
      id: r.id, title: r.title, epicId: r.epicId ?? null,
      startDate: r.startDate ? new Date(r.startDate).toISOString() : null,
      endDate: r.endDate ? new Date(r.endDate).toISOString() : null,
      status: r.status ?? null,
    })),
    counts: {
      epics: epics?.length ?? 0,
      stories: stories?.length ?? 0,
      roadmapItems: roadmapItems?.length ?? 0,
    },
  };
}

export async function chatApply(projectId: number, proposal: ChatProposal) {
  switch (proposal.kind) {
    case 'brief.update': {
      const md = proposal.payload.contentMd;
      return await updateProjectBriefHandler(projectId, md);
    }
    case 'brief.generate': {
      return await generateProjectBriefHandler(projectId, { name: proposal.payload.name, problem: proposal.payload.problem, targetUser: proposal.payload.targetUser, goals: proposal.payload.goals, constraints: proposal.payload.constraints });
    }
    case 'scope.generate': {
      return await generateProjectScopeHandler(projectId, { name: proposal.payload.name, goals: proposal.payload.goals, must: proposal.payload.must, should: proposal.payload.should, could: proposal.payload.could, non_goals: proposal.payload.non_goals });
    }
    case 'epics.generate': {
      return await generateEpics(projectId, { name: proposal.payload.name, strictness: proposal.payload.strictness ?? 'normal' });
    }
    case 'epics.save': {
      return await saveEpics(projectId, proposal.payload.items as unknown as never);
    }
    case 'stories.generate': {
      return await generateStories(projectId, { name: proposal.payload.name, epicTitles: proposal.payload.epicTitles, strictness: proposal.payload.strictness ?? 'normal' });
    }
    case 'stories.save': {
      return await saveStories(projectId, proposal.payload.items as unknown as never);
    }
    case 'roadmap.generate': {
      return await generateRoadmap(projectId, {
        name: proposal.payload.name,
        cadence: proposal.payload.cadence,
        horizonMonths: proposal.payload.horizonMonths,
        startDate: proposal.payload.startDate,
        teamSize: proposal.payload.teamSize,
        workDaysPerWeek: proposal.payload.workDaysPerWeek,
        velocityPointsPerSprint: proposal.payload.velocityPointsPerSprint,
        includeStorySchedule: proposal.payload.includeStorySchedule,
        holidayDatesCsv: proposal.payload.holidayDatesCsv,
        releaseMilestones: proposal.payload.releaseMilestones,
      });
    }
    case 'roadmap.save': {
      return await saveRoadmap(projectId, proposal.payload.items as unknown as never);
    }
    default:
      return { error: 'Unsupported proposal' };
  }
}


