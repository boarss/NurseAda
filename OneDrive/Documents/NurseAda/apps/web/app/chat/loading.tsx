export default function ChatLoading() {
  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="h-5 w-48 animate-pulse rounded bg-slate-800" />
      <div className="h-4 w-64 animate-pulse rounded bg-slate-800/60" />
      <div className="flex-1 animate-pulse rounded-md border border-slate-800 bg-slate-900/40" />
    </div>
  );
}
