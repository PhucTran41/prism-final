"use client";

import { useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Input } from "@/src/frontend/components/ui/input";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { toast } from "sonner";

type Item = { id?: number; title: string; description?: string | null; target?: string | null; priority?: string | null; status?: string | null };

export default function RoadmapEditor({ projectId, initial }: { projectId: string; initial: Item[] }) {
  const [items, setItems] = useState<Item[]>(initial);
  const [saving, setSaving] = useState(false);

  const add = () => setItems((prev) => [...prev, { title: "" }]);
  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const save = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving roadmap…");
    try {
      const res = await fetch(`/api/projects/${projectId}/roadmap`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save");
      }
      toast.success("Saved", { id: toastId });
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save", { id: toastId });
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-md border p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <Input
              placeholder="Title"
              value={item.title}
              onChange={(e) => update(i, { title: e.target.value })}
              className="md:col-span-2"
            />
            <Input placeholder="Target (e.g., Q1-2026)" value={item.target ?? ""} onChange={(e)=>update(i, { target: e.target.value })} />
            <Input placeholder="Priority" value={item.priority ?? ""} onChange={(e)=>update(i, { priority: e.target.value })} />
            <Input placeholder="Status" value={item.status ?? ""} onChange={(e)=>update(i, { status: e.target.value })} />
          </div>
          <Textarea placeholder="Short description" value={item.description ?? ""} onChange={(e)=>update(i, { description: e.target.value })} rows={2} />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => remove(i)}>Remove</Button>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={add}>Add item</Button>
        <Button onClick={save} disabled={saving}>Save</Button>
      </div>
    </div>
  );
}


