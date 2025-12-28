import { DocumentPrismaRepo } from '@/src/backend/modules/infrastructure/document/prisma/repo';
import { AiSdkService } from '@/src/backend/modules/infrastructure/ai/aiSdkService';
import { buildPromptFromTemplate } from '@/src/backend/ai';

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
}) {
  const prompt = await buildPromptFromTemplate('templates/brief.yml', {
    name: payload.name,
    problem: payload.problem,
    targetUser: payload.targetUser,
    goals: payload.goals,
    constraints: payload.constraints,
  });
  const result = await ai.generateText({ model: payload.model ?? 'google/gemini-2.5-flash-lite', prompt });
  const title = `${payload.name} — Project Brief`;
  const saved = await documentRepo.upsertByType(projectId, 'PROJECT_BRIEF', title, result.text);
  return { document: saved, content: result.text } as const;
}


