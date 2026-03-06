"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <h1 className="text-xl font-semibold">NurseAda</h1>
          <h2 className="text-lg font-medium text-slate-200">Something went wrong</h2>
          <p className="text-sm text-slate-400">
            We’re sorry. Please try again or refresh the page. If the problem continues, try again later.
          </p>
          <button
            onClick={reset}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
