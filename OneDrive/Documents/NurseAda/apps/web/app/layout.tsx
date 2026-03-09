import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { ServiceStatus } from "../components/common/ServiceStatus";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-6">
          <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <nav className="flex items-center gap-4">
              <Link href="/" className="text-lg font-semibold tracking-tight text-slate-100 hover:text-slate-200">
                NurseAda
              </Link>
              <Link href="/chat" className="text-sm text-slate-400 hover:text-slate-200">
                Chat
              </Link>
              <Link href="/medications" className="text-sm text-slate-400 hover:text-slate-200">
                Medications
              </Link>
            </nav>
            <ServiceStatus />
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}

