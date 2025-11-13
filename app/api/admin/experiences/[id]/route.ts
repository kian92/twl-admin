import { NextResponse } from "next/server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { experiencePayloadSchema, normalizeExperiencePayload } from "@/lib/validations/experience"

const EXPERIENCE_SELECT_FIELDS =
  "id, title, location, country, duration, price, category, image_url, rating, review_count, description, highlights, inclusions, exclusions, not_suitable_for, meeting_point, what_to_bring, cancellation_policy, itinerary, gallery, faqs, created_at, updated_at"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const { data, error } = await supabase
      .from("experiences")
      .select(EXPERIENCE_SELECT_FIELDS)
      .eq("id", id)
      .maybeSingle()

    if (error) {
      console.error("Failed to fetch experience", error)
      return NextResponse.json({ error: "Failed to fetch experience" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected experience fetch error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const { id } = await params
    // @ts-expect-error - Supabase type inference issue
    const { error } = await supabase.from("experiences").update(normalized).eq("id", id)

    if (error) {
      console.error("Failed to update experience", error)
      return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected experience update error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { error } = await supabase
    .from("experiences")
    .update({ status: "deleted" })
    .eq("id", id)

    if (error) {
      console.error("Failed to delete experience", error)
      return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected experience delete error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
