import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/src/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/src/backend/modules/presentation/project/handlers';
import { generateRoadmap } from '@/src/backend/modules/presentation/planning/handlers';

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const json = await req.json().catch(() => ({}));
  const payload = {
    name: json?.name ?? 'Project',
    strictness: json?.strictness === 'strict' ? 'strict' : 'normal',
    model: json?.model,
    temperature: json?.temperature,
    top_p: json?.top_p,
  };
  const result = await generateRoadmap(id, payload);
  return NextResponse.json(result);
}


