import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient()

    // Get current admin profile
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Only allow choo.developer@gmail.com to reset passwords
    if (user.email !== "choo.developer@gmail.com") {
      return NextResponse.json({ error: "Unauthorized: Only specific admin can reset passwords" }, { status: 403 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase service configuration")
      return NextResponse.json({ error: "Service configuration missing" }, { status: 500 })
    }

    // Create service client for admin operations
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    const { id: staffId } = await params
    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if staff member exists
    const { data: staffMember, error: staffError } = await serviceClient
      .from("admin_profiles")
      .select("id, full_name")
      .eq("id", staffId)
      .single()

    if (staffError || !staffMember) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 })
    }

    // Update password using Supabase admin API
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(staffId, {
      password,
    })

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Password updated successfully",
      staffName: staffMember.full_name,
    })
  } catch (error) {
    console.error("Password update error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}
