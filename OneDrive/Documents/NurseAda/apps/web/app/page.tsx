import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex flex-1 flex-col justify-between gap-8">
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">NurseAda</h1>
        <p className="text-sm text-slate-300">
          24/7 virtual healthcare assistant for everyday questions, built for users across Africa.
        </p>
        <p className="text-xs text-slate-400">
          NurseAda does not replace a doctor. In an emergency, please go to the nearest hospital or call your local
          emergency number.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/chat"
            className="inline-flex w-fit items-center justify-center rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Start a chat
          </Link>
          <Link
            href="/medications"
            className="inline-flex w-fit items-center justify-center rounded-full border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
          >
            Medications
          </Link>
        </div>
      </section>
      <footer className="mt-8 border-t border-slate-800 pt-4 text-xs text-slate-500">
        Made for primary care support. Always follow advice from qualified clinicians in your country.
      </footer>
    </div>
  );
}

