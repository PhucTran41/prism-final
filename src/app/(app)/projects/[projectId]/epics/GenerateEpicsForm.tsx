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

type Epic = { id?: number; title: string; description?: string | null; priority?: string | null; status?: string | null };

export function GenerateEpicsForm({ projectId, projectName, onGenerated, disabled }: { projectId: string; projectName?: string; onGenerated?: (epics: Epic[]) => void; disabled?: boolean }) {
  const [template, setTemplate] = useState<string>("none");
  const [strictness, setStrictness] = useState<"normal"|"strict">("normal");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const applyTemplate = (key: string) => {
    setTemplate(key);
  };

  const submit = async () => {
    setLoading(true);
    const toastId = toast.loading("Generating epics…");
    try {
      const res = await fetch(`/api/projects/${projectId}/epics/generate`, {
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
      const data = await res.json();
      const generated: Epic[] = Array.isArray(data?.epics) ? data.epics : [];
      // auto-save immediately
      const saveRes = await fetch(`/api/projects/${projectId}/epics`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epics: generated }),
      });
      if (!saveRes.ok) {
        const j = await saveRes.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to save generated epics");
      }
      const saved = await saveRes.json();
      if (onGenerated && Array.isArray(saved?.epics)) {
        onGenerated(saved.epics as Epic[]);
      }
      toast.success("Epics generated and saved.", { id: toastId });
      setOpen(false);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to generate";
      toast.error(message, { id: toastId });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled || loading} size="sm">Generate epics</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Epics</DialogTitle>
          <DialogDescription>Seed from your Brief/Scope. You can edit before saving.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Template</Label>
            <Select value={template} onValueChange={(v)=>applyTemplate(v)}>
              <SelectTrigger className="h-8 w-[220px]">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="saas-analytics">SaaS Analytics</SelectItem>
                <SelectItem value="campus-food">Campus Food Finder</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Strictness</Label>
            <Select value={strictness} onValueChange={(v)=>setStrictness(v === 'strict' ? 'strict' : 'normal')}>
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


