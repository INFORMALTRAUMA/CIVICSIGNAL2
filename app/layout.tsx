import type { Metadata, Viewport } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Space_Grotesk, Playfair_Display, IBM_Plex_Mono, IBM_Plex_Sans_Condensed } from "next/font/google"
import PageTransitionOverlay from "@/app/components/PageTransitionOverlay"
import PWARegister from "@/app/components/PWARegister"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" })
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif" })
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-mono" })
const plexCondensed = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-condensed" })

export const metadata: Metadata = {
  title: "Civic Signal",
  description: "Crowd-ranked civic issue reporting and prioritization.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Civic Signal"
  },
  icons: {
    icon: [
      { url: "/icon-192", sizes: "192x192", type: "image/png" },
      { url: "/icon-512", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }]
  }
}

export const viewport: Viewport = {
  themeColor: "#1e7a75",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <html
        lang="en"
        data-theme="sand"
        className={`${spaceGrotesk.variable} ${playfair.variable} ${plexMono.variable} ${plexCondensed.variable}`}
      >
        <body>
          <PWARegister />
          <PageTransitionOverlay />
          {children}
        </body>
      </html>
    </ClerkProvider>
  )
}
