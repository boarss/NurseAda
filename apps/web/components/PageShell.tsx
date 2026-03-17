"use client";

import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  /**
   * Optional max-width class for the inner container, e.g. "max-w-2xl".
   * Defaults to "max-w-5xl".
   */
  maxWidthClass?: string;
  /**
   * Additional classes applied to the inner container.
   */
  className?: string;
};

export function PageShell({
  children,
  maxWidthClass,
  className,
}: PageShellProps) {
  const maxWidth = maxWidthClass ?? "max-w-5xl";
  return (
    <main className="min-h-screen bg-bg">
      <div
        className={`mx-auto w-full ${maxWidth} px-4 sm:px-6 py-6 sm:py-8 ${
          className ?? ""
        }`}
      >
        {children}
      </div>
    </main>
  );
}

