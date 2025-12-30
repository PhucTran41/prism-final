"use client";

import { useEffect, useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Input } from "@/src/frontend/components/ui/input";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { toast } from "sonner";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/src/frontend/components/ui/select";

type Epic = { id?: number; title: string; description?: string | null; priority?: string | null; status?: string | null };

export default function EpicsEditor({ projectId, initial }: { projectId: string; initial: Epic[] }) {
  const [items, setItems] = useState<Epic[]>(initial);
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(JSON.stringify(normalize(initial)));

  // reflect parent changes (e.g., generated draft) but keep saved snapshot
  // so Save becomes enabled for unsaved drafts
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialKey = JSON.stringify(normalize(initial));
  // update items when initial changes
  // (avoid updating savedSnapshot to keep dirty=true until saved)
  useEffect(() => {
    setItems(initial);
  }, [initialKey]);

  const dirty = JSON.stringify(normalize(items)) !== savedSnapshot;

  const add = () => setItems((prev) => [...prev, { title: "" }]);
  const remove = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const update = (idx: number, patch: Partial<Epic>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const save = async () => {
    setSaving(true);
    const toastId = toast.loading("Saving epics…");
    try {
      const res = await fetch(`/api/projects/${projectId}/epics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epics: items }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save");
      }
      toast.success("Saved", { id: toastId });
      setSavedSnapshot(JSON.stringify(normalize(items)));
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save", { id: toastId });
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-md border p-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              placeholder="Epic title"
              value={item.title}
              onChange={(e) => update(i, { title: e.target.value })}
              className="md:col-span-2"
            />
            <Select value={item.priority ?? ""} onValueChange={(v)=>update(i, { priority: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="M">Must</SelectItem>
                <SelectItem value="S">Should</SelectItem>
                <SelectItem value="C">Could</SelectItem>
              </SelectContent>
            </Select>
            <Select value={item.status ?? ""} onValueChange={(v)=>update(i, { status: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLANNED">Planned</SelectItem>
                <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                <SelectItem value="DONE">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Textarea
            placeholder="Short description"
            value={item.description ?? ""}
            onChange={(e) => update(i, { description: e.target.value })}
            rows={3}
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => remove(i)}>
              Remove
            </Button>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={add}>
          Add epic
        </Button>
        <Button onClick={save} disabled={saving || !dirty}>
          Save
        </Button>
      </div>
    </div>
  );
}

function normalize(arr: Epic[]): any {
  return (arr ?? []).map(({ id, title, description, priority, status }) => ({
    id: id ?? undefined,
    title: title ?? '',
    description: description ?? null,
    priority: priority ?? null,
    status: status ?? null,
  }));
}


