import { NextResponse } from "next/server"
import { slugify } from "@/lib/utils/slugify" 
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { experiencePayloadSchema, normalizeExperiencePayload } from "@/lib/validations/experience"

import { EXPERIENCE_SELECT_FIELDS } from "@/lib/constants/experience"

interface ExperienceSlugInfo {
  slug: string
  title: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, slug } = await params

    const { data, error } = await supabase
      .from("experiences")
      .select(EXPERIENCE_SELECT_FIELDS)
      .eq("slug", slug)
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

    // ✅ Fetch the current experience
    const { data: current } = await supabase
    .from("experiences")
    .select("slug, title")
    .eq("id", id)
    .maybeSingle<ExperienceSlugInfo>()

    if (!current) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    // ✅ Determine new slug
    let newSlug = normalized.slug || slugify(normalized.title)

    if (newSlug !== current.slug) {
    // Ensure uniqueness among other records
    let baseSlug = newSlug
    let suffix = 1

    while (true) {
      const { data: existing } = await supabase
        .from("experiences")
        .select("id")
        .eq("slug", newSlug)
        .neq("id", id)
        .maybeSingle()

      if (!existing) break
      newSlug = `${baseSlug}-${suffix++}`
    }

    normalized.slug = newSlug
    }


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
    const { error } = await supabase.from("experiences").delete().eq("id", id)

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
