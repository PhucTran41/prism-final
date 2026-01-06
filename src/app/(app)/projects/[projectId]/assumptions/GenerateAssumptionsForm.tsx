"use client";

import { useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Textarea } from "@/src/frontend/components/ui/textarea";
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

export function GenerateAssumptionsForm({ projectId, projectName }: { projectId: string; projectName?: string }) {
  const [context, setContext] = useState("");
  const [knownRisks, setKnownRisks] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const submit = async () => {
    setLoading(true);
    const toastId = toast.loading("Generating assumptions & risks…");
    try {
      const res = await fetch(`/api/projects/${projectId}/assumptions/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName ?? "Project", context, knownRisks }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to generate");
      }
      toast.success("Assumptions & Risks generated", { id: toastId });
      setOpen(false);
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={loading} variant="default" size="sm" className="inline-flex items-center gap-2">
          Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Generate Assumptions & Risks</DialogTitle>
          <DialogDescription>Provide optional context and any known risks. You can edit later.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="text-sm text-muted-foreground">
            Project:&nbsp;<span className="font-medium text-foreground">{projectName ?? "Project"}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="context">Context (optional)</Label>
            <Textarea id="context" rows={4} value={context} onChange={(e)=>setContext(e.target.value)} placeholder="Any background, scope, constraints, stakeholders…" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="risks">Known risks (optional)</Label>
            <Textarea id="risks" rows={4} value={knownRisks} onChange={(e)=>setKnownRisks(e.target.value)} placeholder="Known risks to incorporate (delivery, product, technical, legal…)" />
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


