"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Star, MapPin, Clock, Users, Check, Heart, Plus, CalendarIcon, Minus, Package } from "lucide-react"
import { useTrip, type AddOnSelection } from "@/components/trip-context"
import { useFavorites } from "@/components/favorites-context"
import { useAuth } from "@/components/auth-context"
import { ShareButtons } from "@/components/share-buttons"
import { LoginPromptDialog } from "@/components/login-prompt-dialog"
import { useState } from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface PackageAddon {
  id: string
  addon_name: string
  description: string
  price: number
  pricing_type: 'per_person' | 'per_group' | 'per_unit'
  max_quantity: number
  is_required: boolean
  category?: string
}

interface ExperienceOverviewProps {
  experience: {
    id: string
    title: string
    location: string
    duration: string
    adult_price: number
    child_price: number
    price?: number
    category: string
    rating: number
    reviewCount: number
    description: string
    highlights: string[]
    available_from?: string | null
    available_to?: string | null
    min_group_size?: number
    max_group_size?: number
  }
  addons?: PackageAddon[]
}

export function ExperienceOverview({ experience, addons = [] }: ExperienceOverviewProps) {
  const { tripItems, addToTrip } = useTrip()
  const { isFavorite, toggleFavorite } = useFavorites()
  const { isAuthenticated } = useAuth()
  const [justAdded, setJustAdded] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const minGroup = Math.max(1, experience.min_group_size ?? 1)
  const maxGroup = Math.max(minGroup, experience.max_group_size ?? minGroup)
  const [adults, setAdults] = useState(() => Math.max(1, minGroup))
  const [children, setChildren] = useState(0)
  const [selectedAddons, setSelectedAddons] = useState<Record<string, number>>({})

  const adultPrice = Number.isFinite(experience.adult_price) ? experience.adult_price : experience.price ?? 0
  const childPrice = Number.isFinite(experience.child_price) ? experience.child_price : adultPrice * 0.7
  const totalPeople = adults + children

  // Calculate add-ons price
  const addonsPrice = addons.reduce((sum, addon) => {
    const quantity = selectedAddons[addon.id] || 0
    if (quantity === 0) return sum

    if (addon.pricing_type === 'per_person') {
      return sum + (addon.price * quantity * totalPeople)
    } else if (addon.pricing_type === 'per_group') {
      return sum + (addon.price * quantity)
    } else { // per_unit
      return sum + (addon.price * quantity)
    }
  }, 0)

  const basePrice = adultPrice * adults + childPrice * children
  const totalPrice = basePrice + addonsPrice

  const availableFrom = experience.available_from ? new Date(experience.available_from) : null
  const availableTo = experience.available_to ? new Date(experience.available_to) : null
  if (availableFrom) availableFrom.setHours(0, 0, 0, 0)
  if (availableTo) availableTo.setHours(0, 0, 0, 0)

  const handleAddToTrip = () => {
    if (!selectedDate) {
      alert("Please select a date for your experience")
      return
    }
    if (totalPeople < minGroup || totalPeople > maxGroup) {
      alert(`Group size must be between ${minGroup} and ${maxGroup} people`)
      return
    }

    // Convert selected add-ons to AddOnSelection format
    const addonsToAdd: AddOnSelection[] = addons
      .filter(addon => (selectedAddons[addon.id] || 0) > 0)
      .map(addon => ({
        id: addon.id,
        name: addon.addon_name,
        description: addon.description || '',
        price: addon.price,
        pricing_type: addon.pricing_type,
        quantity: selectedAddons[addon.id] || 1,
        category: addon.category
      }))

    addToTrip(experience as any, format(selectedDate, "yyyy-MM-dd"), adults, children, addonsToAdd)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 2000)
  }

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    setSelectedAddons(prev => ({
      ...prev,
      [addonId]: checked ? 1 : 0
    }))
  }

  const handleAddonQuantityChange = (addonId: string, delta: number) => {
    const addon = addons.find(a => a.id === addonId)
    if (!addon) return

    setSelectedAddons(prev => {
      const current = prev[addonId] || 0
      const newQuantity = Math.max(0, Math.min(addon.max_quantity || 99, current + delta))
      return {
        ...prev,
        [addonId]: newQuantity
      }
    })
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
      <section className="py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2">
              <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                {experience.category}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-balance">{experience.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="font-semibold text-foreground">{experience.rating}</span>
                  <span>({experience.reviewCount.toLocaleString()} reviews)</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{experience.location}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{experience.duration}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mb-8 pb-8 border-b">
                <Button
                  variant={favorited ? "default" : "outline"}
                  onClick={handleToggleFavorite}
                  className={favorited ? "bg-red-500 hover:bg-red-600" : ""}
                >
                  <Heart className={`mr-2 h-4 w-4 ${favorited ? "fill-current" : ""}`} />
                  {favorited ? "Saved" : "Save"}
                </Button>
                <ShareButtons title={experience.title} description={experience.description} />
              </div>

              {/* Overview */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Overview</h2>
                <p className="text-muted-foreground leading-relaxed mb-6">{experience.description}</p>

                <h3 className="text-lg font-semibold mb-3">Highlights</h3>
                <ul className="space-y-2">
                  {experience.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 sticky top-24">
                <div className="mb-6">
                  <div className="text-sm text-muted-foreground mb-1">From</div>
                  <div className="text-3xl font-bold">${adultPrice}</div>
                  <div className="text-sm text-muted-foreground">Adult · Child ${childPrice}</div>
                </div>

                {/* Date Selection */}
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Select Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => {
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          if (date < today) return true
                          if (availableFrom && date < availableFrom) return true
                          if (availableTo && date > availableTo) return true
                          return false
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {(availableFrom || availableTo) && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {availableFrom ? `Available from ${format(availableFrom, "PPP")}` : "Availability not set"}{" "}
                      {availableTo ? `to ${format(availableTo, "PPP")}` : ""}
                    </p>
                  )}
                </div>

                {/* Number of People */}
                <div className="mb-4 space-y-3">
                  <Label className="text-sm font-medium">Number of People</Label>

                  {/* Adults */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Adults</div>
                      <div className="text-xs text-muted-foreground">Age 13+</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        disabled={adults <= 1 || totalPeople <= minGroup}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{adults}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => {
                          if (totalPeople < maxGroup) {
                            setAdults((prev) => prev + 1)
                          }
                        }}
                        disabled={totalPeople >= maxGroup}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Children</div>
                      <div className="text-xs text-muted-foreground">Age 0-12</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        disabled={children <= 0 || totalPeople <= minGroup}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{children}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => {
                          if (totalPeople < maxGroup) {
                            setChildren((prev) => prev + 1)
                          }
                        }}
                        disabled={totalPeople >= maxGroup}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Add-ons */}
                {addons.length > 0 && (
                  <div className="mb-4 space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Optional Add-ons
                    </Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {addons.map((addon) => {
                        const isSelected = (selectedAddons[addon.id] || 0) > 0
                        const quantity = selectedAddons[addon.id] || 0

                        return (
                          <div key={addon.id} className="border rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <Checkbox
                                  id={`addon-${addon.id}`}
                                  checked={isSelected}
                                  onCheckedChange={(checked) => handleAddonToggle(addon.id, checked as boolean)}
                                />
                                <div className="flex-1 min-w-0">
                                  <label
                                    htmlFor={`addon-${addon.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {addon.addon_name}
                                  </label>
                                  {addon.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{addon.description}</p>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    ${addon.price.toFixed(2)}
                                    {addon.pricing_type === 'per_person' && ' per person'}
                                    {addon.pricing_type === 'per_group' && ' per group'}
                                    {addon.pricing_type === 'per_unit' && ' per unit'}
                                  </div>
                                </div>
                              </div>
                              {isSelected && addon.max_quantity > 1 && (
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleAddonQuantityChange(addon.id, -1)}
                                    disabled={quantity <= 1}
                                  >
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="text-sm font-medium w-4 text-center">{quantity}</span>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleAddonQuantityChange(addon.id, 1)}
                                    disabled={quantity >= addon.max_quantity}
                                  >
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Total Price */}
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Price</span>
                    <span className="text-xl font-bold">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                    <div>
                      {adults} adult{adults > 1 ? "s" : ""} × ${adultPrice.toFixed(2)}
                      {children > 0 && ` + ${children} child${children > 1 ? "ren" : ""} × ${childPrice.toFixed(2)}`}
                    </div>
                    {addonsPrice > 0 && (
                      <div className="text-primary">
                        + Add-ons: ${addonsPrice.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {totalPeople < minGroup && (
                    <div className="text-xs text-amber-600 mt-1">Minimum group size is {minGroup} people.</div>
                  )}
                </div>

                <div className="space-y-2 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-muted-foreground" />
                    <span>
                      Group size: {minGroup}
                      {maxGroup ? `-${maxGroup}` : ""} people
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Duration: {experience.duration}</span>
                  </div>
                </div>

                <Button size="lg" className="w-full mb-3" onClick={handleAddToTrip} disabled={isInTrip}>
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

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Free cancellation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Instant confirmation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary" />
                    <span>Mobile voucher accepted</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
      <LoginPromptDialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt} />
    </>
  )
}
