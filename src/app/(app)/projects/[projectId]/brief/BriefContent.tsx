"use client";

import { useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { MarkdownViewerEditor } from "@/src/frontend/components/common/MarkdownViewerEditor";
import { Loader2, Pencil, X, Save } from "lucide-react";
import { toast } from "sonner";

export function BriefContent({ initial, projectId }: { initial: string; projectId: string }) {
  const [value, setValue] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    setLoading(true);
    const toastId = toast.loading("Saving…");
    try {
      const res = await fetch(`/api/projects/${projectId}/brief`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentMd: value }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save");
      }
      toast.success("Brief updated", { id: toastId });
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to save", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="inline-flex items-center gap-2">
              <X className="h-4 w-4" /> Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={loading} className="inline-flex items-center gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {loading ? "Saving…" : "Save"}
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)} className="inline-flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )}
      </div>
      <MarkdownViewerEditor value={value} mode={editing ? "edit" : "view"} onChange={setValue} />
    </div>
  );
}


