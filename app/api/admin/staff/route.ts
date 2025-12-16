import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

const STAFF_SELECT_FIELDS = "id, full_name, role, avatar_url, is_active, created_at, updated_at, company_name"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase.from("admin_profiles").select("role").eq("id", session.user.id).maybeSingle()

    const adminProfile = profile as Pick<Database["public"]["Tables"]["admin_profiles"]["Row"], "role"> | null

    if (profileError) {
      console.error("Failed to verify admin role", profileError)
      return NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 })
    }

    if (adminProfile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data, error } = await supabase.from("admin_profiles").select(STAFF_SELECT_FIELDS).order("created_at", {
      ascending: false,
    })

    if (error) {
      console.error("Failed to fetch admin staff", error)
      return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("Unexpected staff fetch error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
