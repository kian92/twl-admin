import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

const ensureServiceClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error("Missing Supabase service role configuration")
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

async function requireAdminRole() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from("admin_profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  const adminProfile = profile as Pick<Database["public"]["Tables"]["admin_profiles"]["Row"], "role"> | null

  if (profileError) {
    console.error("Failed to verify admin role", profileError)
    return { error: NextResponse.json({ error: "Unable to verify permissions" }, { status: 500 }) }
  }

  if (adminProfile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const roleCheck = await requireAdminRole()
    if ("error" in roleCheck) {
      return roleCheck.error
    }
    const { supabase } = roleCheck
    const { id } = await params

    const payload = (await request.json().catch(() => null)) as
      | { action: "disable" | "enable" }
      | { action: "update_role"; role: string }
      | null

    if (!payload) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Handle role update
    if (payload.action === "update_role") {
      const validRoles = ["admin", "manager", "support", "sales", "supplier"]
      if (!("role" in payload) || !validRoles.includes(payload.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }

      const { error: updateError } = await (supabase as any)
        .from("admin_profiles")
        .update({ role: payload.role })
        .eq("id", id)

      if (updateError) {
        console.error("Failed to update staff role", updateError)
        return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    // Handle enable/disable
    if (payload.action !== "disable" && payload.action !== "enable") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const serviceClient = ensureServiceClient()
    const isActive = payload.action === "enable"

    const { error: updateError } = await (supabase as any)
      .from("admin_profiles")
      .update({ is_active: isActive })
      .eq("id", id)
    if (updateError) {
      console.error("Failed to update staff profile", updateError)
      return NextResponse.json({ error: "Failed to update staff" }, { status: 500 })
    }

    const metadataUpdate = payload.action === "disable" ? { admin_status: "disabled" } : { admin_status: "active" }
    const { error: metadataError } = await serviceClient.auth.admin.updateUserById(id, {
      user_metadata: metadataUpdate,
    })

    if (metadataError) {
      console.error("Failed to update auth metadata", metadataError)
      return NextResponse.json({ error: metadataError.message }, { status: metadataError.status ?? 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    console.error("Unexpected staff update error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const roleCheck = await requireAdminRole()
    if ("error" in roleCheck) {
      return roleCheck.error
    }
    const { supabase } = roleCheck
    const { id } = await params

    const serviceClient = ensureServiceClient()

    const { error: authError } = await serviceClient.auth.admin.deleteUser(id)
    if (authError) {
      console.error("Failed to delete auth user", authError)
      return NextResponse.json({ error: authError.message }, { status: authError.status ?? 500 })
    }

    const { error: profileError } = await (supabase as any)
      .from("admin_profiles")
      .delete()
      .eq("id", id)
    if (profileError) {
      console.error("Failed to delete admin profile", profileError)
      return NextResponse.json({ error: "Failed to delete admin profile" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message.includes("service role")) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    console.error("Unexpected staff delete error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
