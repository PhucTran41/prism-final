export default function Loading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-7 w-40 rounded bg-muted animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-20 rounded-md bg-muted animate-pulse" />
            <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
        <div className="h-px w-full bg-border" />
      </div>

      {/* Content skeleton */}
      <div className="rounded-lg border bg-card p-6 space-y-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-4 rounded bg-muted animate-pulse ${i % 4 === 0 ? "w-5/6" : i % 4 === 1 ? "w-2/3" : i % 4 === 2 ? "w-3/4" : "w-1/2"}`}
          />
        ))}
      </div>
    </div>
  );
}


