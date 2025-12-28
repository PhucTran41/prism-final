import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import { redirect } from "next/navigation";
import { Header } from "@/src/frontend/components/common/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/");
  }
  return (
    <div className="flex min-h-screen flex-col overflow-hidden">
      <div className="fixed inset-x-0 top-0 z-50 bg-background">
        <Header />
      </div>
      {/* Spacer to account for fixed header height (4rem) */}
      <div className="h-16 shrink-0" />
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}


