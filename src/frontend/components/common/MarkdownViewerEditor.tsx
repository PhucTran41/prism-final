"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { cn } from "@/src/frontend/lib/utils";

type Props = {
  value: string;
  mode: "view" | "edit";
  onChange?: (next: string) => void;
  className?: string;
};

export function MarkdownViewerEditor({ value, mode, onChange, className }: Props) {
  if (mode === "edit") {
    return (
      <Textarea
        className={cn("min-h-[360px] font-mono text-sm", className)}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    );
  }
  return (
    <div className={cn("prose dark:prose-invert max-w-none", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
    </div>
  );
}


