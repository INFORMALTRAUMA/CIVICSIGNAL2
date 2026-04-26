import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Civic Signal",
    short_name: "CivicSignal",
    description: "Crowd-ranked civic issue reporting and prioritization.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f2e8",
    theme_color: "#1e7a75",
    categories: ["utilities", "government", "productivity"],
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
      { src: "/icon-512-maskable", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" }
    ]
  }
}
