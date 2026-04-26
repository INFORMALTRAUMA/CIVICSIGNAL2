/**
 * Single place for colors and layout tokens — keeps screens visually consistent.
 */
export const colors = {
  background: "#f4f5f7",
  surface: "#ffffff",
  surfaceMuted: "#fafafb",
  border: "#e4e7ec",
  text: "#101828",
  textSecondary: "#667085",
  accent: "#0f766e",
  accentMuted: "rgba(15, 118, 110, 0.12)",
  error: "#d92d20",
  success: "#079455",
  onAccent: "#ffffff",
  placeholder: "#98a2b3"
} as const

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20
} as const

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  pill: 9999
} as const

export const font = {
  titleLarge: 22,
  title: 18,
  body: 15,
  small: 13,
  caption: 12
} as const
