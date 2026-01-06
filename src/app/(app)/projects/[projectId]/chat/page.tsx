import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import { headers } from "next/headers";
import ProjectChat from "./ProjectChat";
import { DataStreamProvider } from "./stream/DataStreamProvider";
import { DataStreamHandler } from "./stream/DataStreamHandler";

export default async function ProjectChatPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="p-6">
        <p>Please sign in to use chat.</p>
      </div>
    );
  }
  const cookieHeader = (await headers()).get("cookie") ?? "";
  // Optionally fetch project info
  const resProject = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  }).catch(() => undefined);
  const projectData = resProject ? await resProject.json().catch(() => ({})) : {};
  const projectName: string | undefined = projectData?.name ?? projectData?.project?.name ?? "Project";
  return (
    <DataStreamProvider>
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold">Ask Prism — {projectName}</h1>
          <p className="text-sm text-muted-foreground">Chat with AI to plan and modify this project. Proposals require your confirmation before applying.</p>
        </div>
        <ProjectChat projectId={projectId} />
      </div>
      <DataStreamHandler />
    </DataStreamProvider>
  );
}


