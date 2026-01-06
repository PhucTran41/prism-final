import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/backend/modules/presentation/project/handlers';
import { getAssumptionsRisksHandler, updateAssumptionsRisksHandler } from '@/backend/modules/presentation/document/handlers';
import { updateAssumptionsSchema } from './schemas';

export async function GET(_: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  }
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const result = await getAssumptionsRisksHandler(id);
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
  const json = await req.json();
  const parsed = updateAssumptionsSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.flatten() }, { status: 400 });
  const result = await updateAssumptionsRisksHandler(id, parsed.data.contentMd);
  return NextResponse.json(result);
}


