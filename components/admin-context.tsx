"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react"
import type { SupabaseClient, User } from "@supabase/supabase-js"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

export type AdminRole = "admin" | "manager" | "support"

export interface AdminProfile {
  id: string
  full_name: string | null
  role: AdminRole
  avatar_url: string | null
}

interface SignInResult {
  success: boolean
  error?: string
}

interface AdminContextType {
  supabase: SupabaseClient<Database>
  user: User | null
  profile: AdminProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

const normalizeRole = (role?: string | null): AdminRole => {
  if (role === "admin" || role === "manager" || role === "support") {
    return role
  }
  return "support"
}

export function AdminProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = useCallback(
    async (userId: string) => {
      const { data, error } = await supabase
        .from("admin_profiles")
        .select("id, full_name, role, avatar_url")
        .eq("id", userId)
        .maybeSingle()

      if (error) {
        console.error("Failed to load admin profile", error)
        setProfile(null)
        return
      }

      if (data) {
        setProfile({
          id: data.id,
          full_name: data.full_name,
          role: normalizeRole(data.role),
          avatar_url: data.avatar_url,
        })
      } else {
        setProfile(null)
      }
    },
    [supabase],
  )

  useEffect(() => {
    let isMounted = true

    const init = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (error) {
        console.error("Failed to get auth session", error)
      }

      if (!isMounted) return

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }

      setIsLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }

      setIsLoading(false)
    })

    return () => {
      isMounted = false
      listener.subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    await fetchProfile(user.id)
  }, [fetchProfile, user])

  const signIn = useCallback(
    async (email: string, password: string): Promise<SignInResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        console.error("Admin sign in failed", error)
        return { success: false, error: error.message }
      }

      if (data.user) {
        setUser(data.user)
        await fetchProfile(data.user.id)
      }

      return { success: true }
    },
    [supabase, fetchProfile],
  )

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Admin sign out failed", error)
    }
    setUser(null)
    setProfile(null)
    setIsLoading(false)
  }, [supabase])

  return (
    <AdminContext.Provider
      value={{
        supabase,
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
        refreshProfile,
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
