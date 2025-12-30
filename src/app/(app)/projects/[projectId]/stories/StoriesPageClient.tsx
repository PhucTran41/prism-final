"use client";

import { useState } from "react";
import StoriesEditor from "./StoriesEditor";
import GenerateStoriesButton from "./GenerateStoriesButton";

type Story = { id?: number; epicId?: number | null; title: string; description?: string | null; acceptance?: string | null; priority?: string | null; status?: string | null };

export default function StoriesPageClient({ projectId, projectName, initial }: { projectId: string; projectName?: string; initial: Story[] }) {
  const [items, setItems] = useState<Story[]>(initial);
  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stories</h1>
        <GenerateStoriesButton projectId={projectId} projectName={projectName} />
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">No stories yet. Generate to create a draft.</div>
      ) : (
        <StoriesEditor projectId={projectId} initial={items} />
      )}
    </>
  );
}


