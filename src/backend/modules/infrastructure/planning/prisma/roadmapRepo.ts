import { prismaClient } from '@/src/backend/shared/infrastructure/prisma';

export type RoadmapUpsertInput = {
  id?: number;
  title: string;
  description?: string | null;
  target?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  epicId?: number | null;
  priority?: string | null;
  status?: string | null;
};

export class RoadmapPrismaRepo {
  async list(projectId: number) {
    return prismaClient.roadmapItem.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async bulkUpsert(projectId: number, items: RoadmapUpsertInput[]) {
    const results = [];
    for (const item of items) {
      if (item.id) {
        const updated = await prismaClient.roadmapItem.update({
          where: { id: item.id },
          data: {
            title: item.title,
            description: item.description ?? null,
            target: item.target ?? null,
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null,
            epicId: typeof item.epicId === 'number' ? item.epicId : null,
            priority: item.priority ?? null,
            status: item.status ?? null,
          },
        });
        results.push(updated);
      } else {
        const created = await prismaClient.roadmapItem.create({
          data: {
            projectId,
            title: item.title,
            description: item.description ?? null,
            target: item.target ?? null,
            startDate: item.startDate ? new Date(item.startDate) : null,
            endDate: item.endDate ? new Date(item.endDate) : null,
            epicId: typeof item.epicId === 'number' ? item.epicId : null,
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


