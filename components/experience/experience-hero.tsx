"use client"

import { Button } from "@/components/ui/button"
import { Star, MapPin, Clock, Plus, Check, Heart } from "lucide-react"
import { useTrip } from "@/components/trip-context"
import { useFavorites } from "@/components/favorites-context"
import { useAuth } from "@/components/auth-context"
import { ShareButtons } from "@/components/share-buttons"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useState } from "react"

interface ExperienceHeroProps {
  experience: {
    id: string
    title: string
    location: string
    duration: string
    price: number
    image: string
    category: string
    rating: number
    reviewCount: number
    description: string
    inclusions: string[]
  }
}

export function ExperienceHero({ experience }: ExperienceHeroProps) {
  const { tripItems, addToTrip } = useTrip()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isAuthenticated } = useAuth()
  const [justAdded, setJustAdded] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const handleAddToTrip = () => {
    // Default booking date is today, with 1 adult and 0 children for quick adds from the hero section.
    const today = new Date().toISOString().split("T")[0]
    addToTrip(experience as any, today, 1, 0)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true)
      return
    }
    toggleFavorite(experience as any)
  }

  const isInTrip = tripItems.some((item) => item.id === experience.id)
  const favorited = isFavorite(experience.id)

  return (
    <>
      <section className="relative">
        {/* Hero Image */}
        <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
          <img
            src={experience.image || "/placeholder.svg"}
            alt={experience.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        {/* Content Overlay */}
        <div className="container mx-auto px-4 max-w-7xl relative -mt-32">
          <div className="bg-card rounded-2xl shadow-2xl p-8 md:p-10 border border-border">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex-1">
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                  {experience.category}
                </div>

                <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">{experience.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-secondary text-secondary" />
                    <span className="font-semibold text-foreground">{experience.rating}</span>
                    <span>({experience.reviewCount} reviews)</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-5 w-5" />
                    <span>{experience.location}</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-5 w-5" />
                    <span>{experience.duration}</span>
                  </div>
                </div>

                <p className="text-lg text-muted-foreground leading-relaxed mb-6">{experience.description}</p>

                {/* Favorite and Share Buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant={favorited ? "default" : "outline"}
                    size="lg"
                    onClick={handleToggleFavorite}
                    className={favorited ? "bg-red-500 hover:bg-red-600" : ""}
                  >
                    <Heart className={`mr-2 h-5 w-5 ${favorited ? "fill-current" : ""}`} />
                    {favorited ? "Saved" : "Save"}
                  </Button>
                  <ShareButtons title={experience.title} description={experience.description} />
                </div>
              </div>

              {/* Booking Card */}
              <div className="lg:w-80 flex-shrink-0">
                <div className="bg-muted/50 rounded-xl p-6 border border-border">
                  <div className="mb-6">
                    <div className="text-sm text-muted-foreground mb-1">From</div>
                    <div className="text-4xl font-bold">${experience.price}</div>
                    <div className="text-sm text-muted-foreground">per person</div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full mb-3 bg-primary hover:bg-primary/90"
                    onClick={handleAddToTrip}
                    disabled={isInTrip}
                  >
                    {justAdded ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        Added to Trip!
                      </>
                    ) : isInTrip ? (
                      <>
                        <Check className="mr-2 h-5 w-5" />
                        In Your Trip
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-5 w-5" />
                        Add to My Trip
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">Free cancellation available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
    </>
  )
}
