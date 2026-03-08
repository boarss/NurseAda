import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Asymmetric layout: content left of center, decorative right */}
      <div className="flex-1 flex flex-col justify-center px-6 py-16 sm:px-10 md:px-16 max-w-4xl mx-auto w-full">
        <div className="max-w-xl">
          <p className="text-accent font-body text-sm font-semibold tracking-wide uppercase opacity-0 animate-in animate-in-delay-1">
            Primary care, your way
          </p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-semibold text-fg mt-2 tracking-tight opacity-0 animate-in animate-in-delay-2">
            NurseAda
          </h1>
          <p className="font-body text-muted text-lg sm:text-xl mt-6 leading-relaxed opacity-0 animate-in animate-in-delay-3 max-w-md">
            Your 24/7 AI health assistant for Nigeria and Africa. Symptom
            guidance, medications, and support in English and local languages.
          </p>
          <div className="mt-10 opacity-0 animate-in animate-in-delay-3">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-card bg-primary text-white font-body font-semibold px-8 py-4 shadow-card transition-all duration-200 hover:bg-primary-hover hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg"
            >
              Start chat
              <span className="text-white/80" aria-hidden>
                →
              </span>
            </Link>
          </div>
        </div>
      </div>
      {/* Soft accent bar at bottom for grounding */}
      <div
        className="h-1.5 w-full bg-gradient-to-r from-primary via-accent/80 to-primary"
        aria-hidden
      />
    </main>
  );
}
