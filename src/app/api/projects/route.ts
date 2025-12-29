import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/backend/modules/presentation/auth/handlers';
import { createProjectHandler, listProjectsHandler, getUserIdByEmail } from '@/backend/modules/presentation/project/handlers';
import { createProjectSchema } from './schemas';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return NextResponse.json({ projects: [] });
  const projects = await listProjectsHandler(userId);
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = await getUserIdByEmail(session.user.email);
  if (!userId) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  const json = await req.json();
  const parsed = createProjectSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.flatten() }, { status: 400 });
  }
  const result = await createProjectHandler(Number(userId), parsed.data);
  if ('error' in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result.project, { status: 201 });
}


