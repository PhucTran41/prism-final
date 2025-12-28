"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/src/frontend/components/ui/button";
import { Input } from "@/src/frontend/components/ui/input";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { Label } from "@/src/frontend/components/ui/label";
import { Card, CardContent, CardFooter } from "@/src/frontend/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/src/frontend/components/ui/select";

export function CreateProjectForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [template, setTemplate] = useState<string>("none");

  const applyTemplate = (key: string) => {
    switch (key) {
      case "campus-food":
        setName("Campus Food Finder");
        setDescription("A student‑focused app to discover affordable, nearby meals in minutes.");
        break;
      case "saas-analytics":
        setName("Pulse Analytics");
        setDescription("Self‑serve analytics for small SaaS teams with zero setup.");
        break;
      case "fitness-tracker":
        setName("MicroHabit Fit");
        setDescription("Daily micro‑habits for busy people to stay active in 5 minutes.");
        break;
      case "none":
        // reset
        setName(""); setDescription("");
        break;
    }
    setTemplate(key);
    toast.message("Template applied", { description: "You can tweak the fields before creating." });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    // Basic client-side validation
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Project name is required";
    if (name.trim().length < 2) errs.name = "Project name must be at least 2 characters";
    if (description && description.length > 300) errs.description = "Description must be ≤ 300 characters";
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setLoading(false);
      return;
    }
    try {
      const toastId = toast.loading("Creating project…");
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) {
        const j: unknown = await res.json().catch(() => ({} as unknown));
        const msg = (j as { error?: string })?.error;
        throw new Error(msg || "Failed to create project");
      }
      const project = await res.json();
      const projectId = (project as { id: number }).id;
      toast.success("Project created", { id: toastId });
      router.replace(`/projects/${projectId}/brief`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <form onSubmit={submit}>
        <CardContent className="space-y-5 pt-6">
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Start with the basics. You can generate the brief after creating.
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Start from template:</span>
              <Select value={template} onValueChange={(v)=>applyTemplate(v)}>
                <SelectTrigger className="h-7 w-[190px] text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="campus-food">Campus Food Finder</SelectItem>
                  <SelectItem value="saas-analytics">SaaS Analytics</SelectItem>
                  <SelectItem value="fitness-tracker">Fitness Tracker</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
              placeholder="e.g., Prism MVP"
              aria-invalid={!!fieldErrors.name}
              className={fieldErrors.name ? "border-red-500" : ""}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Make it short and recognizable.</p>
              {fieldErrors.name ? <p className="text-xs text-red-600">{fieldErrors.name}</p> : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Short description</Label>
            <Textarea
              id="description"
              rows={2}
              value={description}
              onChange={(e)=>setDescription(e.target.value)}
              placeholder="One or two lines"
              aria-invalid={!!fieldErrors.description}
              className={fieldErrors.description ? "border-red-500" : ""}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Keep it to a sentence or two (≤ 300 chars).</p>
              <p className={`text-xs ${description.length > 280 ? "text-red-600" : "text-muted-foreground"}`}>
                {description.length}/300
              </p>
            </div>
            {fieldErrors.description ? <p className="text-xs text-red-600">{fieldErrors.description}</p> : null}
          </div>

        </CardContent>

        <CardFooter className="flex items-center gap-2">
          <Button
            type="submit"
            className="inline-flex items-center gap-2"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Creating..." : "Create project"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">Cancel</Link>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}



