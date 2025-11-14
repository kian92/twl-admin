"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Clock, Heart } from "lucide-react"
import { useFavorites } from "@/components/favorites-context"
import { useAuth } from "@/components/auth-context"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import Link from "next/link"
import type { Experience } from "@/components/trip-context"

interface ExperienceCardProps {
  experience: Experience
}

export function ExperienceCard({ experience }: ExperienceCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isAuthenticated } = useAuth()
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    toggleFavorite(experience)
  }

  const favorited = isFavorite(experience.id)

  return (
    <>
      <Link href={`/experiences/${experience.slug}/${experience.id}`}>

        <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-xl transition-all duration-300 h-full">
          <div className="relative h-64 overflow-hidden">
            <img
              src={experience.image || "/placeholder.svg"}
              alt={experience.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <Button
              size="icon"
              variant="ghost"
              className={`absolute top-4 right-4 h-10 w-10 rounded-full transition-all ${
                favorited
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-white/90 backdrop-blur-sm text-foreground hover:bg-white"
              }`}
              onClick={handleToggleFavorite}
            >
              <Heart className={`h-5 w-5 ${favorited ? "fill-current" : ""}`} />
            </Button>
          </div>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-foreground text-foreground" />
                <span className="font-medium text-foreground">{experience.rating? experience.rating: 0}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{experience.duration}</span>
              </div>
            </div>
            <h3 className="font-medium text-lg mb-2 line-clamp-2 group-hover:text-foreground/70 transition-colors">
              {experience.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 flex items-center gap-1">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="line-clamp-1">{experience.location}</span>
            </p>
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wide">From</span>
                <div className="text-xl font-semibold">${experience.price}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
    </>
  )
}
