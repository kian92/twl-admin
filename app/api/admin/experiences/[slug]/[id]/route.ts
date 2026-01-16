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

    // Check user role to determine access
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle<{ role: string | null }>()

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

    // If user is a supplier, verify they own this experience
    if (profile?.role === "supplier" && data.created_by !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
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
      console.error("Validation failed:", parsed.error.errors)
      const issue = parsed.error.errors.at(0)
      return NextResponse.json({ error: issue?.message ?? "Validation failed" }, { status: 400 })
    }

    console.log("Parsed payload:", JSON.stringify(parsed.data, null, 2))
    const normalized = normalizeExperiencePayload(parsed.data)
    console.log("Normalized payload:", JSON.stringify(normalized, null, 2))
    const { id } = await params

    // Check user role to determine access
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle<{ role: string | null }>()

    // ✅ Fetch the current experience
    const { data: current } = await supabase
    .from("experiences")
    .select("slug, title, created_by")
    .eq("id", id)
    .maybeSingle<ExperienceSlugInfo & { created_by: string | null }>()

    if (!current) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    // If user is a supplier, verify they own this experience
    if (profile?.role === "supplier" && current.created_by !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
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

    console.log("About to update experience with normalized payload keys:", Object.keys(normalized))
    console.log("pick_up_information value:", normalized.pick_up_information)

    // Set updated_by to current user
    const updateData = {
      ...normalized,
      updated_by: session.user.id,
    }

    // @ts-expect-error - Supabase type inference issue
    const { error } = await supabase.from("experiences").update(updateData).eq("id", id)

    if (error) {
      console.error("Failed to update experience", error)
      return NextResponse.json({ error: "Failed to update experience" }, { status: 500 })
    }

    console.log("Successfully updated experience")

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
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check user role to determine access
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle<{ role: string | null }>()

    // Fetch experience with gallery
    const { data: experience, error: fetchError } = await supabase
      .from("experiences")
      .select("gallery, created_by")
      .eq("id", id)
      .maybeSingle<{ gallery: string[] | null; created_by: string | null }>();

    if (fetchError || !experience) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 });
    }

    // If user is a supplier, verify they own this experience
    if (profile?.role === "supplier" && experience.created_by !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const gallery: string[] = experience?.gallery ?? [];

    // Delete Bunny images (parallel)
    await Promise.all(
      gallery.map(async (file) => {
        // file may be "filename.jpg" or a full CDN URL
        const url = file.startsWith("http")
          ? file
          : `https://${process.env.NEXT_PUBLIC_BUNNY_CDN_HOST}/${process.env.BUNNY_FOLDER}/${file}`;

        await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/bunny/delete-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      })
    );

    // Delete experience record
    const { error } = await supabase.from("experiences").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete experience", error);
      return NextResponse.json({ error: "Failed to delete experience" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected experience delete error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

