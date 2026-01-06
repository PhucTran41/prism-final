"use client";

import React, { createContext, useContext, useEffect, useId, useMemo, useRef } from "react";
import type { CSSProperties, FC, ReactNode, RefObject } from "react";
import { cn } from "@/src/frontend/lib/utils";
import { Card } from "@/src/frontend/components/ui/card";
import {
  addDays,
  addMonths,
  differenceInCalendarDays,
  differenceInMonths,
  endOfDay,
  endOfMonth,
  format,
  getDaysInMonth,
  isAfter,
  isBefore,
  isSameDay,
  startOfDay,
  startOfMonth,
} from "date-fns";

export type Range = "daily" | "monthly" | "quarterly";

type TimelineData = {
  year: number;
  months: number[]; // month indexes 0..11 present in the view
}[];

export type GanttContextProps = {
  zoom: number;
  range: Range;
  columnWidth: number;
  headerHeight: number;
  sidebarWidth: number;
  rowHeight: number;
  timelineData: TimelineData;
  ref: RefObject<HTMLDivElement | null>;
};

const GanttContext = createContext<GanttContextProps | null>(null);
const useGantt = () => {
  const ctx = useContext(GanttContext);
  if (!ctx) throw new Error("GanttContext not found");
  return ctx;
};

const getStartOf = (range: Range) => (range === "daily" ? startOfDay : startOfMonth);
const getEndOf = (range: Range) => (range === "daily" ? endOfDay : endOfMonth);
const diffCols = (range: Range) => (range === "daily" ? differenceInCalendarDays : differenceInMonths);
const addRange = (range: Range) => (range === "daily" ? addDays : addMonths);

function createTimeline(from: Date, to: Date): TimelineData {
  const data: TimelineData = [];
  const start = new Date(from.getFullYear(), 0, 1);
  const end = new Date(to.getFullYear(), 11, 31);
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) {
    data.push({ year: y, months: [0,1,2,3,4,5,6,7,8,9,10,11] });
  }
  return data;
}

export type GanttProviderProps = {
  children: ReactNode;
  range?: Range;
  zoom?: number;
  from?: Date;
  to?: Date;
  className?: string;
};

export const GanttProvider: FC<GanttProviderProps> = ({
  range = "monthly",
  zoom = 100,
  from,
  to,
  children,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const now = new Date();
  const start = from ? getStartOf(range)(from) : startOfMonth(addMonths(now, -3));
  const end = to ? getEndOf(range)(to) : endOfMonth(addMonths(now, 6));
  const timelineData = useMemo(() => createTimeline(start, end), [start.getTime(), end.getTime()]);
  const headerHeight = 56;
  const sidebarWidth = 280;
  const rowHeight = 36;
  let baseColWidth = 48;
  if (range === "monthly") baseColWidth = 120;
  if (range === "quarterly") baseColWidth = 90;

  const cssVars: CSSProperties = {
    "--gantt-zoom": `${zoom}`,
    "--gantt-column-width": `${(zoom / 100) * baseColWidth}px`,
    "--gantt-header-height": `${headerHeight}px`,
    "--gantt-row-height": `${rowHeight}px`,
    "--gantt-sidebar-width": `${sidebarWidth}px`,
  } as CSSProperties;

  return (
    <GanttContext.Provider
      value={{
        zoom,
        range,
        columnWidth: (zoom / 100) * baseColWidth,
        headerHeight,
        sidebarWidth,
        rowHeight,
        timelineData,
        ref,
      }}
    >
      <div
        className={cn("grid h-full w-full overflow-auto rounded-md bg-secondary", className)}
        style={{ ...cssVars, gridTemplateColumns: "var(--gantt-sidebar-width) 1fr" }}
        ref={ref}
      >
        {children}
      </div>
    </GanttContext.Provider>
  );
};

export const GanttHeader: FC = () => {
  const gantt = useGantt();
  const id = useId();
  return (
    <div className="sticky top-0 z-10 w-max">
      <div
        className="grid bg-backdrop/80 backdrop-blur supports-[backdrop-filter]:bg-backdrop/60"
        style={{ height: "var(--gantt-header-height)", gridTemplateColumns: `repeat(${gantt.timelineData.length * 12}, var(--gantt-column-width))` }}
      >
        {gantt.timelineData.flatMap((y) => y.months.map((m, idx) => (
          <div key={`${id}-${y.year}-${idx}`} className="flex items-end justify-center border-b py-1 text-xs text-muted-foreground">
            {format(new Date(y.year, m, 1), "MMM yyyy")}
          </div>
        )))}
      </div>
    </div>
  );
};

export const GanttSidebar: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="sticky left-0 z-20 border-r bg-background">
    <div className="h-[var(--gantt-header-height)] border-b px-3 flex items-end text-xs text-muted-foreground">Items</div>
    <div>{children}</div>
  </div>
);

export const GanttSidebarGroup: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <div>
    <div className="h-[var(--gantt-row-height)] px-3 flex items-center text-xs text-muted-foreground">{title}</div>
    <div className="divide-y">{children}</div>
  </div>
);

export const GanttSidebarItem: FC<{ name: string; color?: string }> = ({ name, color }) => (
  <div className="h-[var(--gantt-row-height)] px-3 flex items-center gap-2 text-xs">
    <span className="size-2 rounded-full" style={{ backgroundColor: color ?? "#64748b" }} />
    <span className="truncate">{name}</span>
  </div>
);

export const GanttTimeline: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="relative w-max">
    {children}
  </div>
);

export const GanttFeatureList: FC<{ children: ReactNode }> = ({ children }) => (
  <div className="relative" style={{ marginTop: "var(--gantt-header-height)" }}>
    {children}
  </div>
);

export type GanttBar = {
  id: string | number;
  name: string;
  start: Date;
  end?: Date | null;
  color?: string;
  dashed?: boolean;
};

export const GanttBars: FC<{ rows: Array<{ key: string; items: GanttBar[] }>; from?: Date; to?: Date }> = ({ rows }) => {
  const gantt = useGantt();
  const timelineStart = new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1);
  const colWidth = gantt.columnWidth;
  const calcOffset = (date: Date) => {
    const cols = diffCols(gantt.range)(getStartOf(gantt.range)(date), timelineStart);
    if (gantt.range === "daily") return cols * colWidth;
    // monthly/quarterly: add proportion within month
    const monthDays = getDaysInMonth(date);
    const perDay = colWidth / monthDays;
    const startCols = cols;
    return startCols * colWidth + (date.getDate() - 1) * perDay;
  };
  const calcWidth = (start: Date, end?: Date | null) => {
    if (!end) return colWidth;
    if (gantt.range === "daily") {
      const d = Math.max(1, differenceInCalendarDays(getEndOf("daily")(end), getStartOf("daily")(start)));
      return d * colWidth;
    }
    const startMonthDays = getDaysInMonth(start);
    const perDayStart = colWidth / startMonthDays;
    const sameMonth = isSameDay(getStartOf("monthly")(start), getStartOf("monthly")(end));
    if (sameMonth) {
      const innerDays = Math.max(1, differenceInCalendarDays(end, start));
      return innerDays * perDayStart;
    }
    const fullCols = Math.max(0, differenceInMonths(getStartOf("monthly")(end), getStartOf("monthly")(start)) - 1);
    const startRemainder = startMonthDays - start.getDate();
    const endRemainder = end.getDate();
    const endPerDay = colWidth / getDaysInMonth(end);
    return fullCols * colWidth + startRemainder * perDayStart + endRemainder * endPerDay;
  };
  return (
    <div>
      {rows.map((row, idx) => (
        <div
          key={row.key}
          className={cn("relative border-b", idx === rows.length - 1 && "border-0", idx % 2 === 1 && "bg-muted/10")}
          style={{ height: "var(--gantt-row-height)" }}
        >
          {row.items.map((b) => {
            const left = Math.max(0, calcOffset(b.start));
            const width = Math.max(4, calcWidth(b.start, b.end ?? undefined));
            return (
              <div
                key={b.id}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-6 rounded-md px-2 text-xs flex items-center",
                  b.dashed ? "text-foreground border-2 border-dashed bg-transparent" : "text-white"
                )}
                style={{
                  left,
                  width,
                  backgroundColor: b.dashed ? "transparent" : (b.color ?? "#0ea5e9"),
                  borderColor: b.dashed ? (b.color ?? "#0ea5e9") : "transparent",
                }}
                title={`${b.name}: ${format(b.start, "MMM d")} - ${b.end ? format(b.end, "MMM d") : "TBD"}`}
              >
                <span className="truncate">{b.name}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export const GanttToday: FC = () => {
  const gantt = useGantt();
  const id = useId();
  const date = startOfDay(new Date());
  const timelineStart = new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1);
  const cols = diffCols(gantt.range)(getStartOf(gantt.range)(date), timelineStart);
  const monthDays = getDaysInMonth(date);
  const perDay = gantt.columnWidth / monthDays;
  const inner = (date.getDate() - 1) * perDay;
  const left = cols * gantt.columnWidth + inner;
  return (
    <div key={id} className="pointer-events-none absolute inset-y-0 w-px bg-foreground/60" style={{ left }} />
  );
};

export const GanttMarker: FC<{ date: Date; label: string; colorClass?: string }> = ({ date, label, colorClass }) => {
  const gantt = useGantt();
  const timelineStart = new Date(gantt.timelineData.at(0)?.year ?? 0, 0, 1);
  const cols = diffCols(gantt.range)(getStartOf(gantt.range)(date), timelineStart);
  const monthDays = getDaysInMonth(date);
  const perDay = gantt.columnWidth / monthDays;
  const inner = (date.getDate() - 1) * perDay;
  const left = cols * gantt.columnWidth + inner;
  return (
    <div className="pointer-events-none absolute inset-y-0" style={{ left }}>
      <div className="absolute -translate-x-1/2 top-0 z-10 whitespace-nowrap text-xs">
        <span className={cn("rounded-b-md bg-card border px-2 py-0.5", colorClass)}>{label}</span>
      </div>
      <div className={cn("h-full w-px bg-card/70", colorClass)} />
    </div>
  );
};


