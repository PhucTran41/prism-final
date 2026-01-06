import { ReactNode } from "react";
import { AppSidebar } from "@/src/frontend/components/layout/AppSideBar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import { headers } from "next/headers";
import { Brain, FileTextIcon, ListTodo, Map, MessageCircle, Settings, ShieldCheck, Users } from "lucide-react";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const items = [
    { title: "Chat", href: `/projects/${projectId}/chat`, icon: <MessageCircle /> },
    { title: "Project Brief", href: `/projects/${projectId}/brief`, icon: <FileTextIcon /> },
    { title: "Scope & Features", href: `/projects/${projectId}/scope`, icon: <Brain /> },
    { title: "Epics & Stories", href: `/projects/${projectId}/epics`, icon: <ListTodo /> },
    { title: "Roadmap", href: `/projects/${projectId}/roadmap`, icon: <Map /> },
    { title: "Assumptions & Risks", href: `/projects/${projectId}/assumptions`, icon: <ShieldCheck /> },
    { title: "Members", href: `/projects/${projectId}/members`, icon: <Users /> },
    { title: "Settings", href: `/projects/${projectId}/settings`, icon: <Settings /> },
  ];

  const session = await getServerSession(authOptions);
  const user =
    session?.user?.email || session?.user?.name
      ? {
          name: session?.user?.name ?? "User",
          email: session?.user?.email ?? "",
          image: (session?.user as { image?: string | null })?.image ?? undefined,
        }
      : undefined;

  const cookieHeader = (await headers()).get("cookie") ?? "";
  const res = await fetch(`${process.env.NEXTAUTH_URL ?? ""}/api/projects/${projectId}`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  }).catch(() => undefined);
  const projectData = res ? await res.json().catch(() => ({})) : {};
  const projectName: string | undefined = projectData?.name ?? projectData?.project?.name ?? undefined;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="hidden md:block">
        <AppSidebar user={user} project={projectName ? { name: projectName } : undefined} items={items} />
      </div>
      <main className="flex-1 h-full overflow-y-auto">{children}</main>
    </div>
  );
}


