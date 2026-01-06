import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/src/backend/modules/presentation/project/handlers';
import { generateStories } from '@/src/backend/modules/presentation/planning/handlers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const json = await req.json().catch(() => ({}));
  const strictness: 'normal' | 'strict' = json?.strictness === 'strict' ? 'strict' : 'normal';
  const epicTitles: string[] | undefined = Array.isArray(json?.epicTitles) ? (json.epicTitles as string[]) : undefined;
  const payload: { name: string; epicTitles?: string[]; strictness?: 'normal'|'strict'; model?: string; temperature?: number; top_p?: number } = {
    name: json?.name ?? 'Project',
    epicTitles,
    strictness,
    model: json?.model,
    temperature: json?.temperature,
    top_p: json?.top_p,
  };
  const result = await generateStories(id, payload);
  return NextResponse.json(result);
}


