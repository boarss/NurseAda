export default function MedicationsLoading() {
  return (
    <div className="flex flex-1 flex-col gap-8">
      <div className="h-8 w-56 animate-pulse rounded bg-slate-800" />
      <div className="h-4 w-full max-w-md animate-pulse rounded bg-slate-800/60" />
      <div className="grid gap-6 md:grid-cols-1">
        <div className="h-48 animate-pulse rounded-lg border border-slate-800 bg-slate-900/40" />
        <div className="h-64 animate-pulse rounded-lg border border-slate-800 bg-slate-900/40" />
      </div>
    </div>
  );
}
