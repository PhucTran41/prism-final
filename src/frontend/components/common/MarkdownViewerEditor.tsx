"use client";

import React, { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Textarea } from "@/src/frontend/components/ui/textarea";
import { Button } from "@/src/frontend/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/src/frontend/lib/utils";

type Props = {
  value: string;
  mode: "view" | "edit";
  onChange?: (next: string) => void;
  className?: string;
  showFullscreenButton?: boolean;
};

export function MarkdownViewerEditor({
  value,
  mode,
  onChange,
  className,
  showFullscreenButton = true,
}: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // Prevent background scrolling when fullscreen
  useEffect(() => {
    if (!showOverlay) return;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previous;
    };
  }, [showOverlay]);

  const openFullscreen = () => {
    setShowOverlay(true);
    // next frame to enable transition from initial styles
    requestAnimationFrame(() => setIsFullscreen(true));
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
    // wait for transition to complete before unmounting overlay
    window.setTimeout(() => setShowOverlay(false), 200);
  };

  const content = useMemo(
    () =>
      mode === "edit" ? (
        <Textarea
          className={cn("min-h-[360px] font-mono text-sm", className)}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <div className={cn("prose dark:prose-invert max-w-none", className)}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      ),
    [className, mode, onChange, value]
  );

  const fullscreenContent = useMemo(
    () =>
      mode === "edit" ? (
        <Textarea
          className="min-h-[70vh] font-mono text-sm"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <div className="prose dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
        </div>
      ),
    [mode, onChange, value]
  );

  return (
    <>
      <div className="relative">
        {showFullscreenButton ? (
          <div className="absolute right-2 top-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Enter fullscreen"
              onClick={openFullscreen}
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        {content}
      </div>

      {showOverlay ? (
        <div
          className={cn(
            "fixed inset-0 z-[70] bg-background/90 backdrop-blur-sm transition-opacity duration-200",
            isFullscreen ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="absolute inset-0 overflow-auto p-4 md:p-8">
            <div
              className={cn(
                "mx-auto max-w-5xl transition-transform duration-200",
                isFullscreen ? "scale-100" : "scale-95"
              )}
            >
              <div className="sticky top-0 flex justify-end pb-2">
                <Button
                  variant="secondary"
                  size="icon"
                  aria-label="Exit fullscreen"
                  onClick={closeFullscreen}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
              {fullscreenContent}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
