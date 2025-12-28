import { ProjectPrismaRepo } from '@/src/backend/modules/infrastructure/project/prisma/repo';
import { prismaClient } from '@/src/backend/shared/infrastructure/prisma';

const projectRepo = new ProjectPrismaRepo();

export async function listProjectsHandler(userId: number) {
  return projectRepo.listByOwner(userId);
}

export async function createProjectHandler(userId: number, body: { name: string; description?: string | null }) {
  const name = (body?.name ?? '').trim();
  if (!name) {
    return { error: 'Name is required' } as const;
  }
  const project = await projectRepo.create(userId, name, body?.description ?? null);
  return { project } as const;
}

export async function getUserIdByEmail(email: string): Promise<number | null> {
  const u = await prismaClient.user.findUnique({ where: { email } });
  return u?.id ?? null;
}

export async function getOwnedProjectByEmail(email: string, projectId: number) {
  const user = await prismaClient.user.findUnique({ where: { email } });
  if (!user) return null;
  const project = await prismaClient.project.findFirst({
    where: { id: projectId, ownerId: user.id, deletedAt: null },
  });
  return project;
}

export async function getProjectHandler(projectId: number) {
  const project = await projectRepo.getById(projectId);
  if (!project) return { error: 'Not found' } as const;
  return { project } as const;
}

export async function deleteProjectHandler(projectId: number) {
  await projectRepo.softDelete(projectId);
  return { ok: true } as const;
}

