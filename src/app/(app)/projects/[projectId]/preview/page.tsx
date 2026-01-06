import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/backend/modules/presentation/auth/handlers";
import { Card, CardContent } from "@/src/frontend/components/ui/card";
import { Button } from "@/src/frontend/components/ui/button";

export default async function ProjectPreviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-semibold mb-2">Project created</h1>
        <p className="text-muted-foreground">Please sign in to continue.</p>
      </div>
    );
  }
  const { projectId } = await params;
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold mb-2">What would you like to do next?</h1>
      <p className="mb-6 text-sm text-muted-foreground">You can chat with AI to plan everything, or quickly generate a Project Brief.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5 flex h-full flex-col justify-between">
            <div>
              <div className="font-medium mb-1">Chat with AI</div>
              <p className="text-sm text-muted-foreground">Ask Prism to draft or modify documents, backlog, and roadmap.</p>
            </div>
            <div className="mt-4">
              <Button asChild className="w-full"> 
                <Link href={`/projects/${projectId}/chat`}>Open chat</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex h-full flex-col justify-between">
            <div>
              <div className="font-medium mb-1">Quick generate with AI</div>
              <p className="text-sm text-muted-foreground">Jump straight to creating a Project Brief you can refine later.</p>
            </div>
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href={`/projects/${projectId}/brief`}>Generate brief</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


