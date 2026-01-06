import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/backend/modules/presentation/project/handlers';
import { ChatPrismaRepo } from '@/backend/modules/infrastructure/chat/prisma/repo';

export async function GET(_: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const user = await prismaUserIdByEmail(session.user.email);
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const repo = new ChatPrismaRepo();
  const threads = await repo.listThreads(id, user.id);
  return NextResponse.json({ threads });
}

async function prismaUserIdByEmail(email: string): Promise<{ id: number } | null> {
  const { prismaClient } = await import('@/src/backend/shared/infrastructure/prisma');
  return prismaClient.user.findUnique({ where: { email }, select: { id: true } });
}


