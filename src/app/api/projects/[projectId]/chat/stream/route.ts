import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/backend/modules/presentation/project/handlers';
import { z } from 'zod';
import { chatOrchestrate } from '@/backend/modules/presentation/chat/handlers';
import { ChatPrismaRepo } from '@/backend/modules/infrastructure/chat/prisma/repo';

const bodySchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user','assistant','system']), content: z.string() })).min(1),
  threadId: z.number().optional(),
  visibility: z.enum(['private','unlisted','public']).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.email) return new Response('Unauthorized', { status: 401 });
  const email = session.user.email;
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return new Response('Invalid projectId', { status: 400 });
  const owned = await getOwnedProjectByEmail(email, id);
  if (!owned) return new Response('Forbidden', { status: 403 });
  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new Response('Invalid payload', { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const repo = new ChatPrismaRepo();
        let threadId = parsed.data.threadId;
        if (!threadId) {
          const user = await prismaUserIdByEmail(email);
          if (!user) throw new Error('User not found');
          const t = await repo.createThread(id, user.id, parsed.data.visibility ?? 'private');
          threadId = t.id;
        }
        // persist user message (last one)
        const last = parsed.data.messages[parsed.data.messages.length - 1];
        if (last?.role === 'user') {
          await repo.addMessage(threadId!, 'user', last.content);
        }
        write({ threadId });
        let fullText = '';
        const result = await chatOrchestrate(id, parsed.data.messages, (delta: string) => {
          fullText += delta;
          write({ type: 'data-delta', delta });
        });
        const parsedOut = parseChatJson(result?.raw ?? '') ?? {};
        const text: string = (parsedOut as any)?.text ?? result?.raw ?? fullText;
        // persist assistant message (use parsed text if present, otherwise accumulated)
        await repo.addMessage(threadId!, 'assistant', text);
        // auto-title if thread has no title
        try {
          const t = await repo.getThread(threadId!);
          if (t && !t.title) {
            const titleSrc = (parsed.data.messages[parsed.data.messages.length - 2]?.content as string) || text;
            const title = deriveTitle(titleSrc);
            if (title) await repo.updateTitle(threadId!, title);
          }
        } catch {}
        const proposals = (parsedOut as any)?.proposals ?? [];
        write({ type: 'data-finish', text });
        write({ type: 'data-proposals', proposals });
        controller.close();
      } catch (e: any) {
        write({ type: 'data-error', error: e?.message ?? 'stream_failed' });
        controller.close();
      }
    }
  });
  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

async function prismaUserIdByEmail(email: string): Promise<{ id: number } | null> {
  const { prismaClient } = await import('@/src/backend/shared/infrastructure/prisma');
  return prismaClient.user.findUnique({ where: { email }, select: { id: true } });
}

function parseChatJson(text: string): { text?: string; proposals?: any[] } | null {
  try {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const raw = match ? match[1] : text;
    return JSON.parse(raw);
  } catch { return null; }
}

function deriveTitle(s: string): string {
  const clean = (s ?? '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const max = 50;
  const cut = clean.length > max ? clean.slice(0, max) + '…' : clean;
  return cut;
}


