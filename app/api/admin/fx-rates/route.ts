import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { isValidExchangeRate } from "@/lib/utils/currency-converter"
import type { Database } from "@/types/database"

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

  return { supabase, userId: session.user.id }
}

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("fx_rates")
    .select("currency_code, rate_to_usd, updated_at")
    .order("currency_code", { ascending: true })

  if (error) {
    console.error("Failed to fetch fx rates", error)
    return NextResponse.json({ error: "Failed to fetch fx rates" }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function PUT(request: Request) {
  const roleCheck = await requireAdminRole()
  if ("error" in roleCheck) {
    return roleCheck.error
  }
  const { supabase, userId } = roleCheck

  const payload = (await request.json().catch(() => null)) as
    | { currency_code: "SGD" | "MYR"; rate_to_usd: number }
    | null

  if (!payload || !["SGD", "MYR"].includes(payload.currency_code)) {
    return NextResponse.json({ error: "Invalid currency_code" }, { status: 400 })
  }

  const rate = Number(payload.rate_to_usd)
  if (!isValidExchangeRate(rate)) {
    return NextResponse.json({ error: "Invalid rate_to_usd" }, { status: 400 })
  }

  const { error } = await (supabase as any)
    .from("fx_rates")
    .update({ rate_to_usd: rate, updated_by: userId })
    .eq("currency_code", payload.currency_code)

  if (error) {
    console.error("Failed to update fx rate", error)
    return NextResponse.json({ error: "Failed to update fx rate" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
