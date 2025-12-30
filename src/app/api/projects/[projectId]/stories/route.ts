import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/src/backend/modules/presentation/project/handlers';
import { listStories, saveStories } from '@/src/backend/modules/presentation/planning/handlers';

export async function GET(_: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await listStories(id);
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(() => ({}));
  const items = Array.isArray(body?.stories) ? body.stories : [];
  const result = await saveStories(id, items);
  return NextResponse.json(result);
}


