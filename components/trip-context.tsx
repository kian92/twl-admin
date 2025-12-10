"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Experience {
  id: string
  title: string
  location: string
  duration: string
  adult_price: number
  child_price: number
  price?: number
  image: string
  category: string
  rating: number
  description: string
  inclusions: string[]
  slug: string
}

export interface TripItem extends Experience {
  bookingDate: string
  adults: number
  children: number
  totalPrice: number
}

interface TripContextType {
  tripItems: TripItem[]
  addToTrip: (experience: Experience, bookingDate: string, adults: number, children: number) => void
  removeFromTrip: (id: string) => void
  reorderTrip: (items: TripItem[]) => void
  clearTrip: () => void
  getTotalCost: () => number
  getTotalDuration: () => string
}

const TripContext = createContext<TripContextType | undefined>(undefined)

export function TripProvider({ children }: { children: ReactNode }) {
  const [tripItems, setTripItems] = useState<TripItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("wandering-lens-trip")
    if (saved) {
      setTripItems(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage whenever tripItems changes
  useEffect(() => {
    localStorage.setItem("wandering-lens-trip", JSON.stringify(tripItems))
  }, [tripItems])

  const addToTrip = (experience: Experience, bookingDate: string, adults: number, children: number) => {
    setTripItems((prev) => {
      if (prev.find((item) => item.id === experience.id)) {
        return prev
      }
      const adultPrice = Number.isFinite(experience.adult_price) ? experience.adult_price : experience.price ?? 0
      const childPrice = Number.isFinite(experience.child_price)
        ? experience.child_price
        : Number.isFinite(experience.price)
          ? experience.price * 0.7
          : 0
      const totalPrice = adultPrice * adults + childPrice * children
      return [
        ...prev,
        {
          ...experience,
          bookingDate,
          adults,
          children,
          totalPrice,
        },
      ]
    })
  }

  const removeFromTrip = (id: string) => {
    setTripItems((prev) => prev.filter((item) => item.id !== id))
  }

  const reorderTrip = (items: TripItem[]) => {
    setTripItems(items)
  }

  const clearTrip = () => {
    setTripItems([])
  }

  const getTotalCost = () => {
    return tripItems.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const getTotalDuration = () => {
    const totalHours = tripItems.reduce((sum, item) => {
      const hours = Number.parseFloat(item.duration)
      return sum + (isNaN(hours) ? 0 : hours)
    }, 0)

    if (totalHours < 24) {
      return `${totalHours}h`
    }
    const days = Math.floor(totalHours / 24)
    const remainingHours = totalHours % 24
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`
  }

  return (
    <TripContext.Provider
      value={{
        tripItems,
        addToTrip,
        removeFromTrip,
        reorderTrip,
        clearTrip,
        getTotalCost,
        getTotalDuration,
      }}
    >
      {children}
    </TripContext.Provider>
  )
}

export function useTrip() {
  const context = useContext(TripContext)
  if (context === undefined) {
    throw new Error("useTrip must be used within a TripProvider")
  }
  return context
}
