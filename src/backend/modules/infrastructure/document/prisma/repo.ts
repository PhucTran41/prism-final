import { prismaClient } from '@/src/backend/shared/infrastructure/prisma';

export class DocumentPrismaRepo {
  async getByType(projectId: number, type: string) {
    return prismaClient.document.findFirst({
      where: { projectId, type, deletedAt: null },
    });
  }

  async upsertByType(projectId: number, type: string, title: string, markdown: string) {
    const existing = await this.getByType(projectId, type);
    if (existing) {
      return prismaClient.document.update({
        where: { id: existing.id },
        data: { title, contentMd: markdown, updatedAt: new Date() },
      });
    }
    return prismaClient.document.create({
      data: {
        projectId,
        type,
        title,
        contentMd: markdown,
        latestVersion: 0,
      },
    });
  }
}


