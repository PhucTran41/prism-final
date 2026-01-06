import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import { headers } from "next/headers";
import { Separator } from "@/src/frontend/components/ui/separator";
import { Card, CardContent } from "@/src/frontend/components/ui/card";
import RoadmapEditor from "./RoadmapEditor";
import GenerateRoadmapButton from "./GenerateRoadmapButton";

export default async function RoadmapPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return <div className="p-6">Please sign in to view this project.</div>;
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const resProject = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  }).catch(() => undefined);
  const projectData = resProject ? await resProject.json().catch(() => ({})) : {};
  const projectName: string | undefined = projectData?.name ?? projectData?.project?.name ?? undefined;

  const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}/roadmap`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  const data = await res.json().catch(() => ({}));
  const items = Array.isArray(data?.items) ? data.items : [];
  const resEpics = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}/epics`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  }).catch(() => undefined);
  const epicsData = resEpics ? await resEpics.json().catch(() => ({})) : {};
  const epics = Array.isArray(epicsData?.epics) ? epicsData.epics : [];
  const resStories = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}/stories`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  }).catch(() => undefined);
  const storiesData = resStories ? await resStories.json().catch(() => ({})) : {};
  const stories = Array.isArray(storiesData?.stories) ? storiesData.stories : [];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Roadmap</h1>
          <GenerateRoadmapButton projectId={projectId} projectName={projectName} disabled={items.length > 0} />
        </div>
        <p className="text-sm text-muted-foreground">Quarterly items you can edit and save.</p>
        <Separator />
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">No roadmap yet. Generate to create a draft.</div>
          </CardContent>
        </Card>
      ) : (
        <RoadmapEditor projectId={projectId} initial={items} epics={epics} stories={stories} />
      )}
    </div>
  );
}


