export const themeOptions = [
  {
    id: "sand",
    label: "Sandstone",
    hint: "Warm",
    palette: {
      ink: "#101512",
      teal: "#1e7a75",
      sun: "#f0c66a",
      coral: "#e45f5a",
      paper: "#fff8ef"
    }
  },
  {
    id: "harbor",
    label: "Harbor",
    hint: "Cool",
    palette: {
      ink: "#0e1a22",
      teal: "#1a768c",
      sun: "#f5ce6b",
      coral: "#ff7a59",
      paper: "#f7fbff"
    }
  },
  {
    id: "midnight",
    label: "Midnight",
    hint: "Dark",
    palette: {
      ink: "#f3f7f5",
      teal: "#35c2b6",
      sun: "#f6d36f",
      coral: "#ff8a72",
      paper: "#141b19"
    }
  }
] as const

export type ThemeId = (typeof themeOptions)[number]["id"]

export const defaultTheme: ThemeId = "sand"
export const themeStorageKey = "civic-theme"
export const themeEvent = "civic-theme-change"

export const isThemeId = (value: string | null | undefined): value is ThemeId =>
  Boolean(value && themeOptions.some((theme) => theme.id === value))

export const applyTheme = (themeId: ThemeId, persist = true) => {
  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = themeId
  }
  if (persist && typeof window !== "undefined") {
    window.localStorage.setItem(themeStorageKey, themeId)
    window.dispatchEvent(new CustomEvent(themeEvent, { detail: themeId }))
  }
}
