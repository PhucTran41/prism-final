"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/src/frontend/components/ui/input";
import { Button } from "@/src/frontend/components/ui/button";
import { Card, CardContent } from "@/src/frontend/components/ui/card";
import { Badge } from "@/src/frontend/components/ui/badge";
import { Separator } from "@/src/frontend/components/ui/separator";
import { LayoutGrid, List, Search } from "lucide-react";

type ProjectListItem = { id: number; name: string; description?: string | null; status?: string | null; createdAt?: string | null };

export default function ProjectsClient({ initialProjects }: { initialProjects: ProjectListItem[] }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"grid" | "list">("grid");

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialProjects;
    return initialProjects.filter((p) => p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q));
  }, [initialProjects, query]);

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex items-center gap-2">
          <Button variant={mode === "grid" ? "default" : "ghost"} size="icon" onClick={() => setMode("grid")} aria-label="Grid view">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={mode === "list" ? "default" : "ghost"} size="icon" onClick={() => setMode("list")} aria-label="List view">
            <List className="h-4 w-4" />
          </Button>
          <Button asChild>
            <Link href="/projects/new">New project</Link>
          </Button>
        </div>
      </div>
      <div className="mb-6">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a project"
            className="pl-8"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      {projects.length === 0 ? (
        <div className="text-sm text-muted-foreground">No projects found.</div>
      ) : mode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Card key={p.id} className="hover:bg-accent/40 transition">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-medium">{p.name}</div>
                    {p.description ? <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p> : null}
                  </div>
                  <Badge variant="secondary">{mapStatus(p.status)}</Badge>
                </div>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {p.createdAt ? new Date(p.createdAt).toLocaleString() : ""}
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/projects/${p.id}/brief`}>Open</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="grid grid-cols-12 px-4 py-3 text-xs font-medium text-muted-foreground">
            <div className="col-span-6">Project</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-3">Created</div>
            <div className="col-span-1" />
          </div>
          <Separator />
          <ul>
            {projects.map((p) => (
              <li key={p.id} className="grid grid-cols-12 px-4 py-4 items-center hover:bg-accent/40">
                <div className="col-span-6 min-w-0">
                  <div className="font-medium truncate">{p.name}</div>
                  {p.description ? <div className="text-xs text-muted-foreground truncate">{p.description}</div> : null}
                </div>
                <div className="col-span-2">
                  <Badge variant="secondary">{mapStatus(p.status)}</Badge>
                </div>
                <div className="col-span-3 text-sm text-muted-foreground">
                  {p.createdAt ? new Date(p.createdAt).toLocaleString() : "—"}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/projects/${p.id}/brief`} className="underline">Open</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function mapStatus(status?: string | null): string {
  if (!status) return "Draft";
  const s = status.toUpperCase();
  if (s === "ACTIVE") return "Active";
  if (s === "ARCHIVED") return "Archived";
  return "Draft";
}


