import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import Link from "next/link";

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold mb-2">Create a project</h1>
        <p className="text-muted-foreground">Please <Link href="/login" className="underline">sign in</Link> first.</p>
      </div>
    );
  }
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Create a project</h1>
      <CreateProjectForm />
    </div>
  );
}

import { CreateProjectForm } from "./CreateProjectForm";


