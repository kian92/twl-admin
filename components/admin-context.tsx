"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type AdminRole = "admin" | "manager" | "support"

export interface AdminUser {
  id: string
  email: string
  name: string
  role: AdminRole
  avatar?: string
}

interface AdminContextType {
  admin: AdminUser | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => void
  isAuthenticated: boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

// Hardcoded admin users
const ADMIN_USERS: Record<string, { password: string; admin: AdminUser }> = {
  "admin@wanderinglens.com": {
    password: "admin123",
    admin: {
      id: "admin-1",
      email: "admin@wanderinglens.com",
      name: "Admin User",
      role: "admin",
    },
  },
  "manager@wanderinglens.com": {
    password: "manager123",
    admin: {
      id: "admin-2",
      email: "manager@wanderinglens.com",
      name: "Manager User",
      role: "manager",
    },
  },
  "support@wanderinglens.com": {
    password: "support123",
    admin: {
      id: "admin-3",
      email: "support@wanderinglens.com",
      name: "Support User",
      role: "support",
    },
  },
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null)

  useEffect(() => {
    const savedAdmin = localStorage.getItem("wandering-lens-admin")
    if (savedAdmin) {
      setAdmin(JSON.parse(savedAdmin))
    }
  }, [])

  useEffect(() => {
    if (admin) {
      localStorage.setItem("wandering-lens-admin", JSON.stringify(admin))
    } else {
      localStorage.removeItem("wandering-lens-admin")
    }
  }, [admin])

  const signIn = async (email: string, password: string): Promise<boolean> => {
    const adminRecord = ADMIN_USERS[email]
    if (adminRecord && adminRecord.password === password) {
      setAdmin(adminRecord.admin)
      return true
    }
    return false
  }

  const signOut = () => {
    setAdmin(null)
  }

  return (
    <AdminContext.Provider
      value={{
        admin,
        signIn,
        signOut,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider")
  }
  return context
}
