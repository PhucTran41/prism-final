"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

export function ProposalTagLine({ proposal }: { proposal: { kind: string; payload?: unknown } }) {
  const { kind, payload } = proposal;
  const name = getString(payload, "name");
  switch (kind) {
    case "brief.update":
      return <span>Update Project Brief</span>;
    case "brief.generate":
      return <span>Generate Project Brief{ name ? ` for “${name}”` : "" }</span>;
    case "scope.generate":
      return <span>Generate Scope & Features{ name ? ` for “${name}”` : "" }</span>;
    case "risks.generate":
      return <span>Generate assumptions & risks</span>;
    case "epics.generate":
      return <span>Generate epics{ name ? ` for “${name}”` : "" }</span>;
    case "epics.save": {
      const count = getArrayLen(payload, "items");
      return <span>Save {count ?? "some"} epics</span>;
    }
    case "stories.generate":
      return <span>Generate stories{ name ? ` for “${name}”` : "" }</span>;
    case "stories.save": {
      const count = getArrayLen(payload, "items");
      return <span>Save {count ?? "some"} stories</span>;
    }
    case "roadmap.generate": {
      const cadence = getString(payload, "cadence");
      const horizon = getNumber(payload, "horizonMonths");
      return <span>Generate roadmap{ cadence ? ` (${cadence})` : "" }{ horizon ? ` · ${horizon} months` : "" }</span>;
    }
    case "roadmap.save": {
      const count = getArrayLen(payload, "items");
      return <span>Save {count ?? "some"} roadmap items</span>;
    }
    default:
      return <span>{kind}</span>;
  }
}

export function ProposalPreview({ proposal, projectId }: { proposal: { kind: string; payload?: unknown }, projectId: string }) {
  const { kind, payload } = proposal;
  if (kind === "brief.update") {
    const md = getString(payload, "contentMd");
    return <BriefDiffPreview projectId={projectId} nextMd={md ?? ""} />;
  }
  if (kind === "brief.generate") {
    const fields = summarizeProvided(payload, ["problem", "targetUser", "goals", "constraints"]);
    const name = getString(payload, "name");
    return (
      <div className="text-sm">
        {name && <div className="font-medium mb-1">Project: {name}</div>}
        <ul className="list-disc pl-5 space-y-1">
          {fields.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>
    );
  }
  if (kind === "scope.generate") {
    const name = getString(payload, "name");
    const fields = summarizeProvided(payload, ["must", "should", "could", "non_goals"]);
    return (
      <div className="text-sm">
        {name && <div className="font-medium mb-1">Project: {name}</div>}
        <ul className="list-disc pl-5 space-y-1">
          {fields.map((f) => <li key={f}>{f}</li>)}
        </ul>
      </div>
    );
  }
  if (kind === "risks.generate") {
    const risks = getArray(payload, "risks") ?? [];
    return <RisksPreview risks={risks} />;
  }
  if (kind === "epics.generate") {
    const name = getString(payload, "name");
    const strictness = getString(payload, "strictness");
    return (
      <InfoRow rows={[
        ["Project", name ?? "—"],
        ["Strictness", strictness ?? "normal"],
      ]} />
    );
  }
  if (kind === "epics.save") {
    const items = getArray(payload, "items") ?? [];
    return <EpicListWithCounts projectId={projectId} items={items} />;
  }
  if (kind === "stories.generate") {
    const name = getString(payload, "name");
    const epics = getStringArray(payload, "epicTitles");
    return (
      <div className="text-sm">
        {name && <div className="font-medium mb-1">Project: {name}</div>}
        {epics && epics.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-1">Epics</div>
            <div className="flex flex-wrap gap-1">
              {epics.slice(0, 6).map((e, i) => (
                <span key={i} className="rounded-full border px-2 py-0.5 text-xs">{e}</span>
              ))}
              {epics.length > 6 && <span className="text-xs text-muted-foreground">+{epics.length - 6} more</span>}
            </div>
          </div>
        )}
      </div>
    );
  }
  if (kind === "stories.save") {
    const items = getArray(payload, "items");
    return <ListPreview items={items?.map((i) => (getString(i, "title") ?? "Untitled story")) ?? []} label="story" />;
  }
  if (kind === "roadmap.generate") {
    const rows: Array<[string, string]> = [
      ["Cadence", getString(payload, "cadence") ?? "—"],
      ["Horizon", (getNumber(payload, "horizonMonths") ?? 0) > 0 ? `${getNumber(payload, "horizonMonths")} months` : "—"],
      ["Start date", getString(payload, "startDate") ?? "—"],
      ["Team size", getNumber(payload, "teamSize")?.toString() ?? "—"],
      ["Velocity", getNumber(payload, "velocityPointsPerSprint")?.toString() ?? "—"],
      ["Include story schedule", getBool(payload, "includeStorySchedule") ? "Yes" : "No"],
    ];
    return <InfoRow rows={rows} />;
  }
  if (kind === "roadmap.save") {
    const items = getArray(payload, "items") ?? [];
    return <MiniRoadmapBars items={items} />;
  }
  return (
    <div className="text-xs text-muted-foreground">
      No structured preview available for this proposal.
    </div>
  );
}

function BriefDiffPreview({ projectId, nextMd }: { projectId: string; nextMd: string }) {
  const [prevMd, setPrevMd] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/projects/${projectId}/brief`, { cache: "no-store" });
        if (r.ok) {
          const j = await r.json();
          setPrevMd((j?.document?.contentMd as string) ?? "");
        } else {
          setPrevMd("");
        }
      } catch {
        setPrevMd("");
      }
    })();
  }, [projectId]);
  const before = (prevMd ?? "").split("\n");
  const after = (nextMd ?? "").split("\n");
  const max = Math.max(before.length, after.length);
  const rows: Array<{ type: "same" | "add" | "del"; text: string }> = [];
  for (let i = 0; i < max; i++) {
    const a = before[i] ?? "";
    const b = after[i] ?? "";
    if (a === b) rows.push({ type: "same", text: b });
    else {
      if (a) rows.push({ type: "del", text: a });
      if (b) rows.push({ type: "add", text: b });
    }
  }
  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-1 gap-0.5 p-2 text-xs">
        {rows.map((r, i) => (
          <div key={i} className={
            r.type === "add" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded" :
            r.type === "del" ? "bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded line-through" :
            "px-2 py-0.5 text-muted-foreground"
          }>
            {r.text}
          </div>
        ))}
      </div>
      <div className="border-t p-2">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Preview</div>
        <div className="prose prose-sm dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {nextMd}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-center justify-between rounded border bg-muted/40 px-2 py-1">
          <span className="text-xs text-muted-foreground">{k}</span>
          <span className="text-xs">{v}</span>
        </div>
      ))}
    </div>
  );
}

function ListPreview({ items, label }: { items: string[]; label: string }) {
  const show = items.slice(0, 6);
  const more = items.length - show.length;
  return (
    <div className="text-sm">
      <div className="text-xs text-muted-foreground mb-1">{items.length} {label}{items.length === 1 ? "" : "s"}</div>
      <ul className="list-disc pl-5 space-y-1">
        {show.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
      {more > 0 && <div className="mt-1 text-xs text-muted-foreground">+{more} more</div>}
    </div>
  );
}

function RisksPreview({ risks }: { risks: unknown[] }) {
  const show = risks.slice(0, 8);
  return (
    <div className="text-sm space-y-2">
      <div className="text-xs text-muted-foreground">{risks.length} risks identified</div>
      <div className="space-y-2">
        {show.map((r, i) => {
          const title = getString(r, "title") ?? "Risk";
          const desc = getString(r, "description");
          const likelihood = getString(r, "likelihood");
          const impact = getString(r, "impact");
          const mitigation = getString(r, "mitigation_strategy");
          return (
            <div key={i} className="rounded border bg-muted/40 p-2">
              <div className="flex items-center justify-between">
                <div className="font-medium">{title}</div>
                <div className="flex items-center gap-1">
                  {impact && <span className="rounded-full border px-2 py-0.5 text-[10px]">Impact: {impact}</span>}
                  {likelihood && <span className="rounded-full border px-2 py-0.5 text-[10px]">Likelihood: {likelihood}</span>}
                </div>
              </div>
              {desc && <div className="mt-1 text-xs text-muted-foreground">{desc}</div>}
              {mitigation && (
                <div className="mt-1 text-xs">
                  <span className="text-muted-foreground">Mitigation:</span> {mitigation}
                </div>
              )}
            </div>
          );
        })}
        {risks.length > 8 && <div className="text-xs text-muted-foreground">+{risks.length - 8} more</div>}
      </div>
    </div>
  );
}

function EpicListWithCounts({ projectId, items }: { projectId: string; items: unknown[] }) {
  const [counts, setCounts] = useState<Record<number, number> | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/projects/${projectId}/stories`, { cache: "no-store" });
        if (!r.ok) throw new Error("stories list failed");
        const j = await r.json();
        const list = (j?.stories ?? []) as Array<{ epicId: number | null }>;
        const map: Record<number, number> = {};
        for (const s of list) {
          if (typeof s.epicId === "number") map[s.epicId] = (map[s.epicId] ?? 0) + 1;
        }
        setCounts(map);
      } catch {
        setCounts({});
      }
    })();
  }, [projectId]);
  const names = items.map((i) => {
    const id = getNumber(i, "id");
    const title = getString(i, "title") ?? "Untitled epic";
    const count = (id && counts) ? counts[id] : undefined;
    return { id: id ?? undefined, title, count };
  });
  return (
    <div className="text-sm space-y-1">
      {names.slice(0, 8).map((e, idx) => (
        <div key={idx} className="flex items-center justify-between rounded border bg-muted/40 px-2 py-1">
          <span className="truncate">{e.title}</span>
          <span className="ml-2 shrink-0 rounded-full border px-2 py-0.5 text-xs">{e.count ?? 0} stories</span>
        </div>
      ))}
      {names.length > 8 && <div className="text-xs text-muted-foreground">+{names.length - 8} more</div>}
    </div>
  );
}

function MiniRoadmapBars({ items }: { items: unknown[] }) {
  const range = computeDateRange(items);
  return (
    <div className="text-sm space-y-2">
      <div className="text-xs text-muted-foreground">
        {items.length} items{range ? ` · ${range.start} → ${range.end}` : ""}
      </div>
      <div className="space-y-1">
        {items.slice(0, 8).map((it, i) => {
          const title = getString(it, "title") ?? "Milestone";
          const s = getString(it, "startDate");
          const e = getString(it, "endDate");
          let left = 0, width = 100;
          if (range && s && e) {
            const rs = Date.parse(range.start);
            const re = Date.parse(range.end);
            const total = Math.max(re - rs, 1);
            left = Math.max(0, Math.min(99, ((Date.parse(s) - rs) / total) * 100));
            const w = ((Date.parse(e) - Date.parse(s)) / total) * 100;
            width = Math.max(2, Math.min(100 - left, w));
          }
          return (
            <div key={i}>
              <div className="mb-0.5 truncate">{title}</div>
              <div className="relative h-2 w-full rounded bg-muted">
                <div className="absolute top-0 h-2 rounded bg-primary" style={{ left: `${left}%`, width: `${width}%` }} />
              </div>
            </div>
          );
        })}
        {items.length > 8 && <div className="text-xs text-muted-foreground">+{items.length - 8} more</div>}
      </div>
    </div>
  );
}

// Helpers
function isRecord(obj: unknown): obj is Record<string, unknown> {
  return typeof obj === "object" && obj !== null;
}
function getString(obj: unknown, key: string): string | undefined {
  if (isRecord(obj)) {
    const v = obj[key];
    if (typeof v === "string") return v;
  }
  return undefined;
}
function getNumber(obj: unknown, key: string): number | undefined {
  if (isRecord(obj)) {
    const v = obj[key];
    if (typeof v === "number") return v;
  }
  return undefined;
}
function getBool(obj: unknown, key: string): boolean {
  if (isRecord(obj)) {
    const v = obj[key];
    if (typeof v === "boolean") return v;
  }
  return false;
}
function getArray(obj: unknown, key: string): unknown[] | undefined {
  if (isRecord(obj)) {
    const v = obj[key];
    if (Array.isArray(v)) return v as unknown[];
  }
  return undefined;
}
function getArrayLen(obj: unknown, key: string): number | undefined {
  const arr = getArray(obj, key);
  return arr ? arr.length : undefined;
}
function getStringArray(obj: unknown, key: string): string[] | undefined {
  const arr = getArray(obj, key);
  if (!arr) return undefined;
  const out: string[] = [];
  for (const v of arr) if (typeof v === "string") out.push(v);
  return out;
}
function summarizeProvided(obj: unknown, keys: string[]): string[] {
  const out: string[] = [];
  for (const k of keys) {
    const v = getString(obj, k);
    const has = typeof v === "string" && v.trim().length > 0;
    out.push(`${k.replace(/_/g, " ")}: ${has ? "provided" : "—"}`);
  }
  return out;
}
function computeDateRange(items: unknown[]): { start: string; end: string } | null {
  const dates: string[] = [];
  for (const it of items) {
    const s = getString(it, "startDate");
    const e = getString(it, "endDate");
    if (s) dates.push(s);
    if (e) dates.push(e);
  }
  if (dates.length === 0) return null;
  const ms = dates.map((d) => Date.parse(d)).filter((n) => !Number.isNaN(n));
  if (ms.length === 0) return null;
  const start = new Date(Math.min(...ms)).toISOString().slice(0, 10);
  const end = new Date(Math.max(...ms)).toISOString().slice(0, 10);
  return { start, end };
}


