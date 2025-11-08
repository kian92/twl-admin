import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

const schema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters long"),
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Failed to read session for password update", sessionError)
      return NextResponse.json({ error: "Unable to verify session" }, { status: 500 })
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const parsed = schema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors.password?.[0] ?? "Validation failed" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase service role configuration for password endpoint")
      return NextResponse.json({ error: "Service role key is not configured" }, { status: 500 })
    }

    const adminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { error } = await adminClient.auth.admin.updateUserById(session.user.id, {
      password: parsed.data.password,
    })

    if (error) {
      console.error("Failed to update password via admin API", error)
      return NextResponse.json({ error: error.message }, { status: error.status ?? 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected password update error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
