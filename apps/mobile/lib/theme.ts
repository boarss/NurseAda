/**
 * NurseAda mobile theme – aligned with web design tokens.
 * Single source for colors, spacing, and radius.
 */

export const colors = {
  bg: "#faf8f5",
  fg: "#1c1917",
  muted: "#57534e",
  surface: "#ffffff",
  border: "#e7e5e4",
  primary: "#059669",
  primaryHover: "#0a4a3b",
  accent: "#c2410c",
  bubbleUser: "#0d5c4a",
  bubbleAssistant: "#e7e5e4",
  error: "#b91c1c",
  errorBg: "#fef2f2",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  card: 16,
  full: 9999,
} as const;

export const theme = {
  colors,
  spacing,
  radius,
} as const;

export default theme;
