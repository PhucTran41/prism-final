export default function Loading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* Top row: Title + controls */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Projects</h1>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-10 rounded-md bg-muted animate-pulse" />
          <div className="h-10 w-28 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
      {/* Search */}
      <div className="mb-4 w-full max-w-sm h-10 rounded-md bg-muted animate-pulse" />
      {/* Cards skeleton, large like screenshot */}
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card">
            <div className="p-5 space-y-3">
              <div className="h-5 w-40 rounded bg-muted animate-pulse" />
              <div className="h-4 w-64 rounded bg-muted animate-pulse" />
              <div className="h-4 w-56 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


