import type { Metadata, Viewport } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { IntlProvider } from "@/lib/IntlProvider";
import { RegisterSW } from "@/components/RegisterSW";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#059669",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "NurseAda – Your 24/7 Health Assistant",
  description:
    "For patients in Nigeria and Africa: AI primary care—symptom triage and guidance in your language. Core chat works without a hospital account.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "NurseAda",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${sourceSans.variable}`}>
      <body className="font-body antialiased min-h-screen bg-bg text-fg pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <RegisterSW />
        <IntlProvider>
          <AuthProvider>{children}</AuthProvider>
        </IntlProvider>
        <Toaster position="bottom-right" duration={4000} richColors closeButton />
      </body>
    </html>
  );
}
