import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Playfair_Display } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { TripProvider } from "@/components/trip-context"
import { AuthProvider } from "@/components/auth-context"
import { FavoritesProvider } from "@/components/favorites-context"
import { Suspense } from "react"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

export const metadata: Metadata = {
  title: "The Wandering Lens | Your journey, curated your way",
  description:
    "Discover and book the world's most extraordinary travel experiences. Curated tours, activities, and adventures.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${playfair.variable} antialiased`}>
        <Suspense fallback={null}>
          <AuthProvider>
            <FavoritesProvider>
              <TripProvider>{children}</TripProvider>
            </FavoritesProvider>
          </AuthProvider>
          <Analytics />
        </Suspense>
      </body>
    </html>
  )
}
