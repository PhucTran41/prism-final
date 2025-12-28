import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import { headers } from "next/headers";
import ProjectsClient from "../ProjectsClient";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-2xl font-semibold mb-2">Projects</h1>
        <p className="text-muted-foreground">Please <Link href="/login" className="underline">sign in</Link> to view your projects.</p>
      </div>
    );
  }
  type ProjectListItem = { id: number; name: string; description?: string | null; status?: string | null; createdAt?: string | null };
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });
  const data: { projects?: unknown } = await res.json().catch(() => ({ projects: [] as ProjectListItem[] }));
  const projects: ProjectListItem[] = Array.isArray(data.projects) ? (data.projects as ProjectListItem[]) : [];
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      <ProjectsClient initialProjects={projects} />
    </div>
  );
}


