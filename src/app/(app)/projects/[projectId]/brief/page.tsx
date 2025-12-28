import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import { GenerateBriefForm } from "./GenerateBriefForm";
import { headers } from "next/headers";
import { Card, CardContent } from "@/src/frontend/components/ui/card";
import { Separator } from "@/src/frontend/components/ui/separator";
import { CopyButton } from "./CopyButton";
import { BriefContent } from "./BriefContent";

export default async function ProjectBriefPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="p-6">
        <p>Please sign in to view this project.</p>
      </div>
    );
  }
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const resProject = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  }).catch(() => undefined);
  const projectData = resProject ? await resProject.json().catch(() => ({})) : {};
  const projectName: string | undefined = projectData?.name ?? projectData?.project?.name ?? undefined;
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}/brief`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  const data = await res.json().catch(() => ({}));
  const md: string | null = data?.document?.contentMd ?? null;

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Project Brief</h1>
          <div className="flex items-center gap-2">{md ? <CopyButton content={md} /> : <GenerateBriefForm projectId={projectId} projectName={projectName ?? "Project"} />}</div>
        </div>
        <p className="text-sm text-muted-foreground">
          A concise, AI‑generated overview of your project’s problem, target users, goals, constraints, and MVP scope.
        </p>
        <Separator />
      </div>
      {md ? (
        <BriefContent initial={md} projectId={projectId} />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">
              No brief yet. Click <span className="font-medium">Generate brief</span> to create one.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

