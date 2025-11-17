"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createSupabaseBrowserClient } from "@/lib/supabase/client"

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const run = async () => {
      // Process tokens in URL
      await supabase.auth.getSession()

      // Redirect user to final reset password screen (public page)
      router.replace("/reset-password")
    }

    run()
  }, [])

  return <p>Processing authentication…</p>
}
