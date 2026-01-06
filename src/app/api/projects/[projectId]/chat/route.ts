import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/backend/modules/presentation/project/handlers';
import { z } from 'zod';
import { chatOrchestrate } from '@/backend/modules/presentation/chat/handlers';
import { ChatPrismaRepo } from '@/backend/modules/infrastructure/chat/prisma/repo';

const messageSchema = z.object({
  role: z.enum(['user','assistant','system']),
  content: z.string().min(1),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1),
  threadId: z.number().optional(),
  visibility: z.enum(['private','unlisted','public']).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.flatten() }, { status: 400 });
  const repo = new ChatPrismaRepo();
  let threadId = parsed.data.threadId;
  // Create thread lazily on first send
  if (!threadId) {
    // resolve userId by email
    const user = await prismaUserIdByEmail(session.user.email);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    const t = await repo.createThread(id, user.id, parsed.data.visibility ?? 'private');
    threadId = t.id;
  }
  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (last?.role === 'user') {
    await repo.addMessage(threadId!, 'user', last.content);
  }
  const result = await chatOrchestrate(id, parsed.data.messages);
  // Save assistant message (full text)
  try {
    const parsedOut = parseChatJson(result?.raw ?? '');
    await repo.addMessage(threadId!, 'assistant', parsedOut?.text ?? result?.raw ?? '');
  } catch {}
  return NextResponse.json({ ...result, threadId });
}

async function prismaUserIdByEmail(email: string): Promise<{ id: number } | null> {
  const { prismaClient } = await import('@/src/backend/shared/infrastructure/prisma');
  return prismaClient.user.findUnique({ where: { email }, select: { id: true } });
}

function parseChatJson(text: string): { text?: string } | null {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = match ? match[1] : text;
    return JSON.parse(raw);
  } catch { return null; }
}


