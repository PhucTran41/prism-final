import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import { headers } from "next/headers";
import { Separator } from "@/src/frontend/components/ui/separator";
import { Card, CardContent } from "@/src/frontend/components/ui/card";
import StoriesPageClient from "./StoriesPageClient";

export default async function StoriesPage({ params }: { params: Promise<{ projectId: string }> }) {
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

  const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}/stories`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  const data = await res.json().catch(() => ({}));
  const stories = Array.isArray(data?.stories) ? data.stories : [];

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 space-y-2">
        <StoriesPageClient projectId={projectId} projectName={projectName} initial={stories} />
        <p className="text-sm text-muted-foreground">User stories you can edit and save.</p>
        <Separator />
      </div>
      {/* Editor rendered above inside client container */}
    </div>
  );
}


