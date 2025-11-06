"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type MembershipTier = "explorer" | "adventurer" | "voyager"

export interface BookedTrip {
  id: string
  bookingDate: string
  experiences: {
    id: string
    title: string
    location: string
    price: number
    image: string
  }[]
  totalCost: number
  status: "completed" | "upcoming" | "cancelled"
}

export interface User {
  id: string
  email: string
  name: string
  membershipTier: MembershipTier
  points: number
  joinedDate: string
  avatar?: string
  bookingHistory: BookedTrip[]
}

interface PointsHistory {
  id: string
  date: string
  description: string
  points: number
  type: "earned" | "redeemed"
}

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, name: string) => Promise<boolean>
  signOut: () => void
  isAuthenticated: boolean
  getPointsHistory: () => PointsHistory[]
  addPoints: (points: number, description: string) => void
  getBookingHistory: () => BookedTrip[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Hardcoded dummy users
const DUMMY_USERS: Record<string, { password: string; user: User }> = {
  "explorer@test.com": {
    password: "password123",
    user: {
      id: "1",
      email: "explorer@test.com",
      name: "Alex Explorer",
      membershipTier: "explorer",
      points: 250,
      joinedDate: "2024-01-15",
      bookingHistory: [
        {
          id: "BK001",
          bookingDate: "2024-03-15",
          experiences: [
            {
              id: "1",
              title: "Tanah Lot Temple Sunset Tour",
              location: "Bali, Indonesia",
              price: 45,
              image: "/tanah-lot-temple-sunset.jpg",
            },
            {
              id: "2",
              title: "Ubud Rice Terraces & Temples",
              location: "Bali, Indonesia",
              price: 55,
              image: "/bali-temple-rice-terraces.jpg",
            },
          ],
          totalCost: 100,
          status: "completed",
        },
      ],
    },
  },
  "adventurer@test.com": {
    password: "password123",
    user: {
      id: "2",
      email: "adventurer@test.com",
      name: "Sam Adventurer",
      membershipTier: "adventurer",
      points: 1500,
      joinedDate: "2023-08-20",
      bookingHistory: [
        {
          id: "BK002",
          bookingDate: "2024-04-01",
          experiences: [
            {
              id: "13",
              title: "Tokyo Street Food Tour",
              location: "Tokyo, Japan",
              price: 75,
              image: "/tokyo-food-tour.jpg",
            },
          ],
          totalCost: 75,
          status: "upcoming",
        },
        {
          id: "BK003",
          bookingDate: "2024-02-28",
          experiences: [
            {
              id: "7",
              title: "Bangkok Street Food Tour",
              location: "Bangkok, Thailand",
              price: 35,
              image: "/bangkok-street-food-tour.jpg",
            },
            {
              id: "9",
              title: "Chiang Mai Elephant Sanctuary",
              location: "Chiang Mai, Thailand",
              price: 85,
              image: "/chiang-mai-elephant-sanctuary.jpg",
            },
          ],
          totalCost: 120,
          status: "completed",
        },
        {
          id: "BK004",
          bookingDate: "2024-01-10",
          experiences: [
            {
              id: "3",
              title: "White Water Rafting Adventure",
              location: "Bali, Indonesia",
              price: 65,
              image: "/white-water-rafting-bali.jpg",
            },
          ],
          totalCost: 65,
          status: "completed",
        },
      ],
    },
  },
  "voyager@test.com": {
    password: "password123",
    user: {
      id: "3",
      email: "voyager@test.com",
      name: "Jordan Voyager",
      membershipTier: "voyager",
      points: 5000,
      joinedDate: "2023-03-10",
      bookingHistory: [
        {
          id: "BK005",
          bookingDate: "2024-05-15",
          experiences: [
            {
              id: "16",
              title: "Santorini Sunset Sailing",
              location: "Santorini, Greece",
              price: 120,
              image: "/santorini-sunset-sailing.jpg",
            },
            {
              id: "17",
              title: "Athens Acropolis & Museum Tour",
              location: "Athens, Greece",
              price: 65,
              image: "/athens-acropolis-tour.jpg",
            },
          ],
          totalCost: 185,
          status: "upcoming",
        },
        {
          id: "BK006",
          bookingDate: "2024-03-20",
          experiences: [
            {
              id: "14",
              title: "Mount Fuji & Hakone Day Trip",
              location: "Tokyo, Japan",
              price: 95,
              image: "/mount-fuji-hakone-tour.jpg",
            },
            {
              id: "15",
              title: "Kyoto Bamboo Forest & Temples",
              location: "Kyoto, Japan",
              price: 70,
              image: "/kyoto-bamboo-forest.jpg",
            },
          ],
          totalCost: 165,
          status: "completed",
        },
        {
          id: "BK007",
          bookingDate: "2024-02-05",
          experiences: [
            {
              id: "8",
              title: "Phi Phi Islands Speedboat Tour",
              location: "Phuket, Thailand",
              price: 90,
              image: "/phi-phi-islands-thailand.jpg",
            },
          ],
          totalCost: 90,
          status: "completed",
        },
        {
          id: "BK008",
          bookingDate: "2024-01-15",
          experiences: [
            {
              id: "1",
              title: "Tanah Lot Temple Sunset Tour",
              location: "Bali, Indonesia",
              price: 45,
              image: "/tanah-lot-temple-sunset.jpg",
            },
            {
              id: "4",
              title: "Traditional Balinese Spa Experience",
              location: "Bali, Indonesia",
              price: 50,
              image: "/balinese-spa-massage.jpg",
            },
            {
              id: "6",
              title: "Bali Jungle Swing & Waterfall",
              location: "Bali, Indonesia",
              price: 60,
              image: "/bali-jungle-swing.jpg",
            },
          ],
          totalCost: 155,
          status: "completed",
        },
      ],
    },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([])

  useEffect(() => {
    const savedUser = localStorage.getItem("wandering-lens-user")
    const savedHistory = localStorage.getItem("wandering-lens-points-history")
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedHistory) {
      setPointsHistory(JSON.parse(savedHistory))
    } else {
      setPointsHistory(getInitialPointsHistory())
    }
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem("wandering-lens-user", JSON.stringify(user))
    } else {
      localStorage.removeItem("wandering-lens-user")
    }
  }, [user])

  useEffect(() => {
    localStorage.setItem("wandering-lens-points-history", JSON.stringify(pointsHistory))
  }, [pointsHistory])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const userRecord = DUMMY_USERS[email]
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user)
      return true
    }
    return false
  }

  const signUp = async (email: string, password: string, name: string): Promise<boolean> => {
    if (DUMMY_USERS[email]) {
      return false
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      name,
      membershipTier: "explorer",
      points: 100,
      joinedDate: new Date().toISOString().split("T")[0],
      bookingHistory: [],
    }

    setUser(newUser)
    return true
  }

  const signOut = () => {
    setUser(null)
    setPointsHistory([])
  }

  const getPointsHistory = () => {
    return pointsHistory
  }

  const addPoints = (points: number, description: string) => {
    if (!user) return

    const newHistory: PointsHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      description,
      points,
      type: points > 0 ? "earned" : "redeemed",
    }

    setPointsHistory((prev) => [newHistory, ...prev])
    setUser((prev) => (prev ? { ...prev, points: prev.points + points } : null))
  }

  const getBookingHistory = () => {
    return user?.bookingHistory || []
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signUp,
        signOut,
        isAuthenticated: !!user,
        getPointsHistory,
        addPoints,
        getBookingHistory,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

function getInitialPointsHistory(): PointsHistory[] {
  return [
    {
      id: "1",
      date: "2024-03-15",
      description: "Booked Bali Temple Tour",
      points: 150,
      type: "earned",
    },
    {
      id: "2",
      date: "2024-03-10",
      description: "Referral bonus - Friend joined",
      points: 200,
      type: "earned",
    },
    {
      id: "3",
      date: "2024-03-05",
      description: "Redeemed free add-on",
      points: -500,
      type: "redeemed",
    },
    {
      id: "4",
      date: "2024-02-28",
      description: "Booked Tokyo Food Tour",
      points: 180,
      type: "earned",
    },
    {
      id: "5",
      date: "2024-02-20",
      description: "Monthly bonus points",
      points: 100,
      type: "earned",
    },
  ]
}
