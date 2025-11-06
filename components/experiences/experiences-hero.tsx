"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function ExperiencesHero() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <section className="bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 py-16 md:py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">Discover Your Next Adventure</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Browse thousands of experiences and build your perfect trip playlist
          </p>

          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search destinations, activities, or experiences..."
              className="pl-12 h-14 text-base bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
