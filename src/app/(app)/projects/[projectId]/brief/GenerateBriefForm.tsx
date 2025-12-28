"use client";

import { useState } from "react";
import { Button } from "@/src/frontend/components/ui/button";
import { Input } from "@/src/frontend/components/ui/input";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { Label } from "@/src/frontend/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function GenerateBriefForm({ projectId }: { projectId: string }) {
  const [name, setName] = useState("New MVP Project");
  const [problem, setProblem] = useState("Users struggle to ...");
  const [targetUser, setTargetUser] = useState("Early‑stage founders, indie hackers");
  const [goals, setGoals] = useState("Validate idea; produce docs; iterate quickly");
  const [constraints, setConstraints] = useState("2‑week timeline; one developer");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    const toastId = toast.loading("Generating brief…");
    try {
      const res = await fetch(`/api/projects/${projectId}/brief/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, problem, targetUser, goals, constraints }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || "Failed to generate");
      }
      toast.success("Brief generated", { id: toastId });
      window.location.reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to generate", { id: toastId });
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button onClick={submit} disabled={loading} variant="default" size="sm" className="inline-flex items-center gap-2">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Generating..." : "Generate brief"}
      </Button>
    </div>
  );
}


