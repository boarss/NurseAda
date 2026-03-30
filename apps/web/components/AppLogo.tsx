"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";

type AppLogoProps = {
  variant?: "default" | "compact";
  className?: string;
};

export function AppLogo({ variant = "default", className = "" }: AppLogoProps) {
  const t = useTranslations();
  const size = variant === "compact" ? 36 : 44;
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center rounded-card transition-opacity duration-fast ease-out-expo hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg ${className}`}
    >
      <Image
        src="Nurseada logo asset.svg"
        width={size}
        height={size}
        alt={t("meta.logoAlt")}
        priority={variant === "default"}
        unoptimized
      />
    </Link>
  );
}
