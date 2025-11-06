"use client"

import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"

interface DestinationCardProps {
  destination: {
    name: string
    slug: string
    description: string
    image: string
    experienceCount: number
  }
}

export function DestinationCard({ destination }: DestinationCardProps) {
  return (
    <Link href={`/destinations/${destination.slug}`}>
      <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300">
        <div className="relative h-[400px] overflow-hidden">
          <Image
            src={destination.image || "/placeholder.svg"}
            alt={destination.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <h3 className="font-serif text-3xl font-normal mb-2">{destination.name}</h3>
            <p className="text-sm text-white/90 mb-3 text-pretty">{destination.description}</p>
            <div className="text-sm text-white/80">
              {destination.experienceCount} experience{destination.experienceCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
