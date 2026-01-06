"use client";

import { useState } from "react";
import EpicsEditor from "./EpicsEditor";
import { GenerateEpicsForm } from "./GenerateEpicsForm";

type Epic = { id?: number; title: string; description?: string | null; priority?: string | null; status?: string | null };
type Story = { id?: number; epicId?: number | null; title: string; description?: string | null; acceptance?: string | null; priority?: string | null; status?: string | null };

export default function EpicsPageClient({ projectId, projectName, initial, initialStories }: { projectId: string; projectName?: string; initial: Epic[]; initialStories: Story[] }) {
  const [items, setItems] = useState<Epic[]>(initial);
  const [stories, setStories] = useState<Story[]>(initialStories);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Epics</h1>
        <div className="flex items-center gap-2">
          <GenerateEpicsForm
            projectId={projectId}
            projectName={projectName}
            onGenerated={(epics: Epic[])=>setItems(epics)}
            disabled={items.length > 0}
          />
        </div>
      </div>
      <EpicsEditor projectId={projectId} initial={items} initialStories={stories} onStoriesChange={setStories} />
    </>
  );
}


