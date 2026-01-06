export default function Loading() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-7 w-48 rounded bg-muted" />
        <div className="h-4 w-80 rounded bg-muted" />
        <div className="h-64 w-full rounded bg-muted" />
      </div>
    </div>
  );
}


