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
  const payload: {
    name: string;
    strictness?: 'normal'|'strict';
    model?: string;
    temperature?: number;
    top_p?: number;
    cadence?: 'weekly'|'monthly'|'quarterly';
    horizonMonths?: number;
    startDate?: string;
    maxItemsPerPeriod?: number;
    notes?: string;
    teamSize?: number;
    workDaysPerWeek?: number;
    velocityPointsPerSprint?: number;
    avgStoryPoints?: number;
    avgEpicPoints?: number;
    includeStorySchedule?: boolean;
    holidayDatesCsv?: string;
    releaseMilestones?: string;
  } = {
    name: json?.name ?? 'Project',
    strictness: (json?.strictness === 'strict' ? 'strict' : 'normal') as 'normal'|'strict',
    model: json?.model,
    temperature: json?.temperature,
    top_p: json?.top_p,
    cadence:
      json?.cadence === 'weekly' || json?.cadence === 'monthly' || json?.cadence === 'quarterly'
        ? (json.cadence as 'weekly'|'monthly'|'quarterly')
        : undefined,
    horizonMonths: Number.isFinite(json?.horizonMonths) ? json.horizonMonths : undefined,
    startDate: typeof json?.startDate === 'string' ? json.startDate : undefined,
    maxItemsPerPeriod: Number.isFinite(json?.maxItemsPerPeriod) ? json.maxItemsPerPeriod : undefined,
    notes: typeof json?.notes === 'string' ? json.notes : undefined,
    teamSize: Number.isFinite(json?.teamSize) ? json.teamSize : undefined,
    workDaysPerWeek: Number.isFinite(json?.workDaysPerWeek) ? json.workDaysPerWeek : undefined,
    velocityPointsPerSprint: Number.isFinite(json?.velocityPointsPerSprint) ? json.velocityPointsPerSprint : undefined,
    avgStoryPoints: Number.isFinite(json?.avgStoryPoints) ? json.avgStoryPoints : undefined,
    avgEpicPoints: Number.isFinite(json?.avgEpicPoints) ? json.avgEpicPoints : undefined,
    includeStorySchedule: Boolean(json?.includeStorySchedule),
    holidayDatesCsv: typeof json?.holidayDatesCsv === 'string' ? json.holidayDatesCsv : undefined,
    releaseMilestones: typeof json?.releaseMilestones === 'string' ? json.releaseMilestones : undefined,
  };
  const result = await generateRoadmap(id, payload);
  return NextResponse.json(result);
}


