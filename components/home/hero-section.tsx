"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Users } from "lucide-react"
import { Card } from "@/components/ui/card"

export function HeroSection() {
  const router = useRouter()
  const [destination, setDestination] = useState("")

  const handleSearch = () => {
    if (destination) {
      router.push(`/experiences?search=${encodeURIComponent(destination)}`)
    } else {
      router.push("/experiences")
    }
  }

  return (
    <section className="relative h-[600px] md:h-[700px] flex items-center justify-center overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/bali-temple-rice-terraces.jpg"
          alt="Luxury travel destination"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container text-center text-white px-4">
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-normal mb-4 md:mb-6 text-balance leading-tight">
          Discover extraordinary experiences,
          <br />
          curated for the curious traveler
        </h1>

        <p className="text-lg md:text-xl mb-8 md:mb-12 text-white/90 max-w-2xl mx-auto text-pretty">
          Your journey, curated your way
        </p>

        <Card className="max-w-4xl mx-auto bg-white/95 backdrop-blur-sm p-3 md:p-2 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1.5fr_auto] gap-3 md:gap-2">
            {/* Destination field */}
            <div className="flex items-center gap-3 px-4 py-4 md:py-3 border-b md:border-b-0 md:border-r border-border">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-foreground uppercase tracking-wide block mb-1.5">
                  Destination
                </label>
                <Input
                  type="text"
                  placeholder="Where would you like to go?"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground text-base"
                />
              </div>
            </div>

            {/* Dates field */}
            <div className="flex items-center gap-3 px-4 py-4 md:py-3 border-b md:border-b-0 md:border-r border-border">
              <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-foreground uppercase tracking-wide block mb-1.5">
                  Dates
                </label>
                <button className="text-left text-base md:text-sm text-muted-foreground hover:text-foreground transition-colors w-full min-h-[24px]">
                  Check in → Check out
                </button>
              </div>
            </div>

            {/* Guests field */}
            <div className="flex items-center gap-3 px-4 py-4 md:py-3 border-b md:border-b-0 border-border">
              <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <label className="text-xs font-medium text-foreground uppercase tracking-wide block mb-1.5">
                  Guests
                </label>
                <button className="text-left text-base md:text-sm text-muted-foreground hover:text-foreground transition-colors w-full min-h-[24px]">
                  2 adults, 0 children
                </button>
              </div>
            </div>

            {/* Search button */}
            <div className="flex items-center px-2 pt-2 md:pt-0">
              <Button
                onClick={handleSearch}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 h-14 md:h-full text-base font-medium"
              >
                Search
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
