import { prismaClient } from '@/src/backend/shared/infrastructure/prisma';

export type EpicUpsertInput = {
  id?: number;
  title: string;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
};

export class EpicPrismaRepo {
  async list(projectId: number) {
    return prismaClient.epic.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async bulkUpsert(projectId: number, items: EpicUpsertInput[]) {
    const results = [];
    for (const item of items) {
      if (item.id) {
        const updated = await prismaClient.epic.update({
          where: { id: item.id },
          data: {
            title: item.title,
            description: item.description ?? null,
            priority: item.priority ?? null,
            status: item.status ?? null,
          },
        });
        results.push(updated);
      } else {
        const created = await prismaClient.epic.create({
          data: {
            projectId,
            title: item.title,
            description: item.description ?? null,
            priority: item.priority ?? null,
            status: item.status ?? null,
          },
        });
        results.push(created);
      }
    }
    return results;
  }
}


