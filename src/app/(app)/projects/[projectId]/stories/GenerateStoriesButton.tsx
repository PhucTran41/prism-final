"use client";

import { useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Label } from "@/src/frontend/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/src/frontend/components/ui/dialog";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/src/frontend/components/ui/select";

export default function GenerateStoriesButton({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [strictness, setStrictness] = useState<"normal"|"strict">("normal");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const submit = async () => {
    setLoading(true);
    const toastId = toast.loading("Generating stories…");
    try {
      const res = await fetch(`/api/projects/${projectId}/stories/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName ?? "Project",
          strictness,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to generate");
      }
      toast.success("Stories generated (review in list)", { id: toastId });
      setOpen(false);
      location.reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={loading} size="sm">Generate stories</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Stories</DialogTitle>
          <DialogDescription>Draft user stories from your Brief/Scope.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Strictness</Label>
            <Select value={strictness} onValueChange={(v)=>setStrictness(v as any)}>
              <SelectTrigger className="h-8 w-[220px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="strict">Strict</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={()=>setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="inline-flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


