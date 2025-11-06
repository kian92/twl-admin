"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface Experience {
  id: string
  title: string
  location: string
  duration: string
  price: number
  image: string
  category: string
  rating: number
  description: string
  inclusions: string[]
}

interface FavoritesContextType {
  favorites: Experience[]
  addToFavorites: (experience: Experience) => void
  removeFromFavorites: (id: string) => void
  isFavorite: (id: string) => boolean
  toggleFavorite: (experience: Experience) => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Experience[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("wandering-lens-favorites")
    if (saved) {
      setFavorites(JSON.parse(saved))
    }
  }, [])

  // Save to localStorage whenever favorites changes
  useEffect(() => {
    localStorage.setItem("wandering-lens-favorites", JSON.stringify(favorites))
  }, [favorites])

  const addToFavorites = (experience: Experience) => {
    setFavorites((prev) => {
      if (prev.find((item) => item.id === experience.id)) {
        return prev
      }
      return [...prev, experience]
    })
  }

  const removeFromFavorites = (id: string) => {
    setFavorites((prev) => prev.filter((item) => item.id !== id))
  }

  const isFavorite = (id: string) => {
    return favorites.some((item) => item.id === id)
  }

  const toggleFavorite = (experience: Experience) => {
    if (isFavorite(experience.id)) {
      removeFromFavorites(experience.id)
    } else {
      addToFavorites(experience)
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        toggleFavorite,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
