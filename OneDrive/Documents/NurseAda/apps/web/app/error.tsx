"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-lg font-semibold text-slate-100">Something went wrong</h2>
      <p className="max-w-sm text-sm text-slate-400">
        We couldn’t load this page. Please try again. If the problem continues, try refreshing or coming back later.
      </p>
      <button
        onClick={reset}
        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
      >
        Try again
      </button>
    </div>
  );
}
