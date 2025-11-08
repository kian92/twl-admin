import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
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

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(getUrl(), getAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Cookies can only be modified in Server Actions or Route Handlers
        }
      },
    },
  })
}
