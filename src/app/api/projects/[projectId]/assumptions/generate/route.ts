import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { getOwnedProjectByEmail } from '@/backend/modules/presentation/project/handlers';
import { generateAssumptionsRisksHandler } from '@/backend/modules/presentation/document/handlers';
import { generateAssumptionsSchema } from './schemas';

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { projectId } = await params;
  const id = Number.parseInt(projectId, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
  }
  const owned = await getOwnedProjectByEmail(session.user.email, id);
  if (!owned) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const json = await req.json();
  const parsed = generateAssumptionsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.flatten() }, { status: 400 });
  }
  const result = await generateAssumptionsRisksHandler(id, parsed.data);
  return NextResponse.json(result);
}


