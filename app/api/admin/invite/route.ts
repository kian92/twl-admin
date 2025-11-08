import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase/server"

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(120),
  password: z.string().min(6),
  role: z.enum(["admin", "manager", "support"]),
})

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Failed to read session before account creation", sessionError)
      return NextResponse.json({ error: "Unable to verify session" }, { status: 500 })
    }

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: requesterProfile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()

    if (profileError) {
      console.error("Failed to load requester role", profileError)
      return NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 })
    }

    // Type assertion for role check
    const profileRole = (requesterProfile as { role: string | null } | null)?.role

    if (!requesterProfile || profileRole !== "admin") {
      return NextResponse.json({ error: "Only admins can create team accounts" }, { status: 403 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const parsed = inviteSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase service configuration for account creation")
      return NextResponse.json({ error: "Service role key is not configured" }, { status: 500 })
    }

    // Create service client without explicit Database type to avoid type inference issues
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Create the user account
    const { data, error } = await serviceClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
      },
    })

    if (error) {
      console.error("Supabase account creation error", error)
      return NextResponse.json({ error: error.message }, { status: error.status ?? 500 })
    }

    if (data?.user) {
      // Create admin profile
      const { error: profileUpsertError } = await serviceClient
        .from("admin_profiles")
        .upsert(
          {
            id: data.user.id,
            full_name: parsed.data.full_name,
            role: parsed.data.role,
            avatar_url: data.user.user_metadata?.avatar_url ?? null,
          },
          { onConflict: "id" }
        )

      if (profileUpsertError) {
        console.error("Failed to create admin profile after account creation", profileUpsertError)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected account creation error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
