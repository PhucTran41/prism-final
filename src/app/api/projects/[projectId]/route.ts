import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { deleteProjectHandler, getOwnedProjectByEmail, getProjectHandler } from '@/backend/modules/presentation/project/handlers';

export async function GET(_: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await getProjectHandler(id);
  if ('error' in result) return NextResponse.json(result, { status: 404 });
  return NextResponse.json(result.project);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await deleteProjectHandler(id);
  return NextResponse.json({ ok: true });
}


