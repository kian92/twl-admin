"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { allExperiences } from "@/lib/data/experiences"

export function TrendingExperiences() {
  const experiences = allExperiences.slice(0, 6)

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-normal mb-4">Popular searches</h2>
          <p className="text-muted-foreground">Discover our most sought-after experiences</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {experiences.map((experience) => (
            <Link key={experience.id} href={`/experiences/${experience.slug}/${experience.id}`}>
              <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="relative h-[320px] overflow-hidden">
                  <img
                    src={experience.image || "/placeholder.svg"}
                    alt={experience.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="font-serif text-2xl font-normal text-white text-center px-6 uppercase tracking-widest">
                      {experience.category}
                    </h3>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/experiences">
            <Button variant="outline" size="lg" className="px-8 bg-transparent">
              View All Experiences
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
