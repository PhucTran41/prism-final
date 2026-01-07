import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/backend/modules/presentation/project/handlers';
import { ChatPrismaRepo } from '@/backend/modules/infrastructure/chat/prisma/repo';

export async function GET(_: NextRequest, { params }: { params: Promise<{ projectId: string; threadId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId, threadId } = await params;
  const pid = Number.parseInt(projectId, 10);
  const tid = Number.parseInt(threadId, 10);
  if (!Number.isFinite(pid) || pid <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  if (!Number.isFinite(tid) || tid <= 0) return NextResponse.json({ error: 'Invalid threadId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, pid);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const repo = new ChatPrismaRepo();
  const thread = await repo.getThread(tid);
  if (!thread || thread.projectId !== pid) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const rows = await repo.listMessages(tid);
  const messages = rows.map(r => ({ role: r.role as 'user'|'assistant', content: r.content ?? '' }));
  return NextResponse.json({ thread: { id: thread.id, meta: (thread as any).meta ?? null }, messages });
}


