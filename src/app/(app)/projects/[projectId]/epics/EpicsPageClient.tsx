"use client";

import { useState } from "react";
import EpicsEditor from "./EpicsEditor";
import { GenerateEpicsForm } from "./GenerateEpicsForm";
import { Button } from "@/src/frontend/components/ui/button";

type Epic = { id?: number; title: string; description?: string | null; priority?: string | null; status?: string | null };

export default function EpicsPageClient({ projectId, projectName, initial }: { projectId: string; projectName?: string; initial: Epic[] }) {
  const [items, setItems] = useState<Epic[]>(initial);

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Epics</h1>
        <GenerateEpicsForm projectId={projectId} projectName={projectName} onGenerated={(epics)=>setItems(epics as any)} disabled={items.length > 0} />
      </div>
      {items.length === 0 ? (
        <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
          No epics yet. Click <span className="font-medium">Generate epics</span> to create a draft.
        </div>
      ) : (
        <EpicsEditor projectId={projectId} initial={items} />
      )}
    </>
  );
}


