"use client";

import { useEffect } from "react";

export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Try to activate the newest SW as soon as possible.
          void registration.update();
        })
        .catch(() => {});
    }
  }, []);

  return null;
}
