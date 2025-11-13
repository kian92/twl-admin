import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { experiencePayloadSchema, normalizeExperiencePayload } from "@/lib/validations/experience"

const EXPERIENCE_SELECT_FIELDS =
  "id, title, location, country, duration, price, category, image_url, rating, review_count, description, highlights, inclusions, exclusions, not_suitable_for, meeting_point, what_to_bring, cancellation_policy, itinerary, gallery, faqs, created_at, updated_at"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase.from("experiences").select(EXPERIENCE_SELECT_FIELDS).in("status", ["active", "draft"]).order("created_at", {
      ascending: false,
    })

    if (error) {
      console.error("Failed to fetch experiences", error)
      return NextResponse.json({ error: "Failed to fetch experiences" }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("Unexpected experiences fetch error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
    }

    const parsed = experiencePayloadSchema.safeParse(payload)
    if (!parsed.success) {
      const issue = parsed.error.errors.at(0)
      return NextResponse.json({ error: issue?.message ?? "Validation failed" }, { status: 400 })
    }

    const normalized = normalizeExperiencePayload(parsed.data)
    const { data, error } = await supabase.from("experiences").insert(normalized as any).select("id").single()

    if (error) {
      console.error("Failed to create experience", error)
      return NextResponse.json({ error: "Failed to create experience" }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: (data as any)?.id })
  } catch (error) {
    console.error("Unexpected experience creation error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
