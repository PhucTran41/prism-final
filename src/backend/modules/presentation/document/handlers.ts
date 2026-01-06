import { DocumentPrismaRepo } from '@/backend/modules/infrastructure/document/prisma/repo';
import { AiSdkService } from '@/backend/modules/infrastructure/ai/aiSdkService';
import { buildPromptFromTemplate, loadTemplate } from '@/backend/ai';

const documentRepo = new DocumentPrismaRepo();
const ai = new AiSdkService();

export async function getProjectBriefHandler(projectId: number) {
  const doc = await documentRepo.getByType(projectId, 'PROJECT_BRIEF');
  return { document: doc } as const;
}

export async function updateProjectBriefHandler(projectId: number, contentMd: string) {
  // Preserve existing title if exists; else default
  const existing = await documentRepo.getByType(projectId, 'PROJECT_BRIEF');
  const title = existing?.title ?? "Project Brief";
  const saved = await documentRepo.upsertByType(projectId, 'PROJECT_BRIEF', title, contentMd);
  return { document: saved } as const;
}

export async function generateProjectBriefHandler(projectId: number, payload: {
  name: string;
  problem?: string;
  targetUser?: string;
  goals?: string;
  constraints?: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  strictness?: 'normal' | 'strict';
}) {
  const system = (await loadTemplate('system/default.yml')).template;
  const rubric = (await loadTemplate('rubrics/brief.yml')).template;
  const prompt = await buildPromptFromTemplate('tasks/generate_brief.yml', {
    system,
    rubric,
    name: payload.name,
    problem: payload.problem,
    targetUser: payload.targetUser,
    goals: payload.goals,
    constraints: payload.constraints,
    strictness: payload.strictness ?? 'normal',
  });
  const result = await ai.generateText({
    model: payload.model ?? 'google/gemini-2.5-flash-lite',
    prompt,
    temperature: payload.temperature ?? 0.5,
    topP: payload.top_p ?? 0.9,
  });
  const title = `${payload.name} — Project Brief`;
  const saved = await documentRepo.upsertByType(projectId, 'PROJECT_BRIEF', title, result.text);
  return { document: saved, content: result.text } as const;
}

export async function getProjectScopeHandler(projectId: number) {
  const doc = await documentRepo.getByType(projectId, 'PROJECT_SCOPE');
  return { document: doc } as const;
}

export async function generateProjectScopeHandler(projectId: number, payload: {
  name: string;
  goals?: string;
  must?: string;
  should?: string;
  could?: string;
  non_goals?: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  strictness?: 'normal' | 'strict';
}) {
  // Load brief to use as context
  const brief = await documentRepo.getByType(projectId, 'PROJECT_BRIEF');
  let briefContext = brief?.contentMd ?? '';
  if ((briefContext?.length ?? 0) > 3000) {
    // Summarize to keep prompt small
    const system = (await loadTemplate('system/default.yml')).template;
    const summaryPrompt = await buildPromptFromTemplate('helpers/summarize_brief.yml', {
      system,
      brief: briefContext,
    });
    const summaryResp = await ai.generateText({
      model: payload.model ?? 'google/gemini-2.5-flash-lite',
      prompt: summaryPrompt,
      temperature: 0.3,
      topP: 0.9,
    });
    briefContext = summaryResp.text;
  }
  const system = (await loadTemplate('system/default.yml')).template;
  const rubric = (await loadTemplate('rubrics/scope.yml')).template;
  const prompt = await buildPromptFromTemplate('tasks/generate_scope.yml', {
    system,
    rubric,
    name: payload.name,
    brief: briefContext,
    goals: payload.goals,
    must: payload.must,
    should: payload.should,
    could: payload.could,
    non_goals: payload.non_goals,
    strictness: payload.strictness ?? 'normal',
  });
  const result = await ai.generateText({
    model: payload.model ?? 'google/gemini-2.5-flash-lite',
    prompt,
    temperature: payload.temperature ?? 0.4,
    topP: payload.top_p ?? 0.9,
  });
  const title = `${payload.name} — Scope & Features`;
  const saved = await documentRepo.upsertByType(projectId, 'PROJECT_SCOPE', title, result.text);
  return { document: saved, content: result.text } as const;
}

export async function getAssumptionsRisksHandler(projectId: number) {
  const doc = await documentRepo.getByType(projectId, 'ASSUMPTIONS_RISKS');
  return { document: doc } as const;
}

export async function updateAssumptionsRisksHandler(projectId: number, contentMd: string) {
  const existing = await documentRepo.getByType(projectId, 'ASSUMPTIONS_RISKS');
  const title = existing?.title ?? "Assumptions & Risks";
  const saved = await documentRepo.upsertByType(projectId, 'ASSUMPTIONS_RISKS', title, contentMd);
  return { document: saved } as const;
}

export async function generateAssumptionsRisksHandler(projectId: number, payload: {
  name: string;
  context?: string;
  knownRisks?: string;
  model?: string;
  temperature?: number;
  top_p?: number;
  strictness?: 'normal' | 'strict';
}) {
  const system = (await loadTemplate('system/default.yml')).template;
  const rubric = (await loadTemplate('rubrics/assumptions.yml')).template;
  const prompt = await buildPromptFromTemplate('tasks/generate_assumptions.yml', {
    system,
    rubric,
    name: payload.name,
    context: payload.context,
    knownRisks: payload.knownRisks,
    strictness: payload.strictness ?? 'normal',
  });
  const result = await ai.generateText({
    model: payload.model ?? 'google/gemini-2.5-flash-lite',
    prompt,
    temperature: payload.temperature ?? 0.4,
    topP: payload.top_p ?? 0.9,
  });
  const title = `${payload.name} — Assumptions & Risks`;
  const saved = await documentRepo.upsertByType(projectId, 'ASSUMPTIONS_RISKS', title, result.text);
  return { document: saved, content: result.text } as const;
}


