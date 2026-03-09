export default function RootLoading() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="h-8 w-32 animate-pulse rounded bg-slate-800" />
      <div className="h-4 w-56 animate-pulse rounded bg-slate-800/60" />
    </div>
  );
}
