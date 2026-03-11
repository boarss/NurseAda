import React, { type ReactElement, type ReactNode } from "react";
import { render } from "@testing-library/react";

import { IntlProvider } from "@/lib/IntlProvider";
import { AuthProvider } from "@/lib/AuthContext";

type WrapperProps = { children: ReactNode };

function Providers({ children }: WrapperProps) {
  return (
    <IntlProvider>
      <AuthProvider>{children}</AuthProvider>
    </IntlProvider>
  );
}

export function renderWithProviders(ui: ReactElement, options?: Parameters<typeof render>[1]) {
  return render(ui, { wrapper: Providers, ...options });
}

