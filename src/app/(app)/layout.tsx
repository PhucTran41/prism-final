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
    <>
      <Header />
      {children}
    </>
  );
}


