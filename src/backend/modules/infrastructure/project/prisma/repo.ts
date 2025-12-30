import { prismaClient } from '@/backend/shared/infrastructure/prisma';
import { ProjectStatus, type ProjectEntity } from '@/backend/modules/domain/project/types';

export class ProjectPrismaRepo {
  async listByOwner(ownerId: number): Promise<ProjectEntity[]> {
    const rows = await prismaClient.project.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows as unknown as ProjectEntity[];
  }

  async create(ownerId: number, name: string, description?: string | null): Promise<ProjectEntity> {
    const row = await prismaClient.project.create({
      data: {
        ownerId,
        name,
        description: description ?? null,
        status: ProjectStatus.DRAFT,
      },
    });
    return row as unknown as ProjectEntity;
  }

  async getById(projectId: number): Promise<ProjectEntity | null> {
    const row = await prismaClient.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });
    return (row as unknown as ProjectEntity) ?? null;
  }

  async softDelete(projectId: number): Promise<void> {
    await prismaClient.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });
  }
}

export class DocumentPrismaRepo {
  // Moved to document module
}


