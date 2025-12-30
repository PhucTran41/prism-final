import { prismaClient } from '@/src/backend/shared/infrastructure/prisma';

export type StoryUpsertInput = {
  id?: number;
  epicId?: number | null;
  title: string;
  description?: string | null;
  acceptance?: string | null;
  priority?: string | null;
  status?: string | null;
};

export class StoryPrismaRepo {
  async list(projectId: number) {
    return prismaClient.story.findMany({
      where: { projectId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async bulkUpsert(projectId: number, items: StoryUpsertInput[]) {
    const results = [];
    for (const item of items) {
      if (item.id) {
        const updated = await prismaClient.story.update({
          where: { id: item.id },
          data: {
            epicId: item.epicId ?? null,
            title: item.title,
            description: item.description ?? null,
            acceptance: item.acceptance ?? null,
            priority: item.priority ?? null,
            status: item.status ?? null,
          },
        });
        results.push(updated);
      } else {
        const created = await prismaClient.story.create({
          data: {
            projectId,
            epicId: item.epicId ?? null,
            title: item.title,
            description: item.description ?? null,
            acceptance: item.acceptance ?? null,
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


