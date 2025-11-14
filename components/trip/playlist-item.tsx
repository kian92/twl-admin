"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, MapPin, Clock, X, Calendar, Users } from "lucide-react"
import { useTrip, type TripItem } from "@/components/trip-context"
import Link from "next/link"
import { format } from "date-fns"

interface PlaylistItemProps {
  experience: TripItem
  index: number
}

export function PlaylistItem({ experience, index }: PlaylistItemProps) {
  const { removeFromTrip } = useTrip()

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 cursor-move">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Drag Handle */}
          <div className="flex items-center">
            <GripVertical className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          {/* Day Number */}
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-primary">{index + 1}</span>
            </div>
          </div>

          {/* Image */}
          <div className="relative h-20 w-28 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={experience.image || "/placeholder.svg"}
              alt={experience.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link href={`/experiences/${experience.slug}/${experience.id}`}>

              <h3 className="font-semibold text-lg mb-1 line-clamp-1 hover:text-primary transition-colors">
                {experience.title}
              </h3>
            </Link>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {experience.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {experience.duration}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {format(new Date(experience.bookingDate), "MMM dd, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {experience.adults} adult{experience.adults > 1 ? "s" : ""}
                {experience.children > 0 && `, ${experience.children} child${experience.children > 1 ? "ren" : ""}`}
              </span>
            </div>
            {/* </CHANGE> */}
            <div className="inline-block bg-accent/10 text-accent px-2 py-0.5 rounded text-xs font-medium">
              {experience.category}
            </div>
          </div>

          {/* Price & Remove */}
          <div className="flex flex-col items-end justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeFromTrip(experience.id)}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="text-right">
              <div className="text-xl font-bold">${experience.totalPrice.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">total</div>
              {/* </CHANGE> */}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
