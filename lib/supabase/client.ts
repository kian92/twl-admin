import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/database"

const getUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set")
  }
  return url
}

const getAnonKey = () => {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set")
  }
  return anonKey
}

export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(getUrl(), getAnonKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })
