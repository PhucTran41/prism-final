import { prismaClient } from '@/src/backend/shared/infrastructure/prisma';

export class ChatPrismaRepo {
  async createThread(projectId: number, userId: number, visibility: string = 'private', title?: string) {
    return prismaClient.chatThread.create({
      data: { projectId, userId, visibility, title: title ?? null },
    });
  }

  async updateTitle(threadId: number, title: string) {
    return prismaClient.chatThread.update({
      where: { id: threadId },
      data: { title },
    });
  }

  async getThread(threadId: number) {
    return prismaClient.chatThread.findUnique({ where: { id: threadId } });
  }

  async listThreads(projectId: number, userId?: number) {
    return prismaClient.chatThread.findMany({
      where: {
        projectId,
        deletedAt: null,
        ...(userId ? { userId } : {}),
      },
      select: { id: true, title: true, visibility: true, updatedAt: true, userId: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async listMessages(threadId: number) {
    return prismaClient.chatMessage.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMessage(threadId: number, role: 'user'|'assistant', content?: string, parts?: unknown) {
    return prismaClient.chatMessage.create({
      data: {
        threadId,
        role,
        content: content ?? null,
        parts: parts as any,
      },
    });
  }
}


