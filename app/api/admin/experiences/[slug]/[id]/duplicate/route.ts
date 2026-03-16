import { NextResponse } from "next/server"
import { slugify } from "@/lib/utils/slugify"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

type ExperienceRow = Database["public"]["Tables"]["experiences"]["Row"]

const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(
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

    const { id } = await params

    // Check user role
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle<{ role: string | null }>()

    // Fetch the original experience
    const { data: original, error: fetchError } = await supabase
      .from("experiences")
      .select("*")
      .eq("id", id)
      .maybeSingle<ExperienceRow>()

    if (fetchError || !original) {
      return NextResponse.json({ error: "Experience not found" }, { status: 404 })
    }

    // If user is a supplier, verify they own this experience
    if (profile?.role === "supplier" && original.created_by !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Generate unique slug based on original title with "copy" suffix
    const baseSlug = slugify(`${original.title} copy`)
    let uniqueSlug = baseSlug
    let suffix = 1

    while (true) {
      const { data: existing } = await supabase
        .from("experiences")
        .select("id")
        .eq("slug", uniqueSlug)
        .maybeSingle()

      if (!existing) break
      uniqueSlug = `${baseSlug}-${++suffix}`
    }

    // Build duplicated experience — strip identity fields, set status to draft
    const { id: _id, slug: _slug, created_at: _ca, updated_at: _ua, ...rest } = original
    const duplicatedExperience = {
      ...rest,
      slug: uniqueSlug,
      title: `${original.title} (Copy)`,
      title_zh: original.title_zh ? `${original.title_zh} (副本)` : null,
      status: "draft",
      created_by: session.user.id,
      updated_by: session.user.id,
      rating: null,
      review_count: null,
      // Do not copy gallery images — keep same URLs as reference (they're shared CDN links)
    }

    const { data: newExperience, error: insertError } = await supabase
      .from("experiences")
      .insert(duplicatedExperience as any)
      .select("id, slug")
      .single<{ id: string; slug: string }>()

    if (insertError || !newExperience) {
      console.error("Failed to duplicate experience", insertError)
      return NextResponse.json({ error: "Failed to duplicate experience" }, { status: 500 })
    }

    // Duplicate packages
    const { data: packages } = await serviceSupabase
      .from("experience_packages")
      .select(`
        *,
        pricing_tiers:package_pricing_tiers(*),
        addons:package_addons(*)
      `)
      .eq("experience_id", id)
      .order("display_order", { ascending: true })

    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        const { id: pkgId, created_at: _pca, updated_at: _pua, pricing_tiers, addons, ...pkgRest } = pkg

        const { data: newPkg, error: pkgError } = await serviceSupabase
          .from("experience_packages")
          .insert({ ...pkgRest, experience_id: newExperience.id })
          .select("id")
          .single()

        if (pkgError || !newPkg) {
          console.error("Failed to duplicate package", pkgError)
          continue
        }

        // Duplicate pricing tiers
        if (pricing_tiers && pricing_tiers.length > 0) {
          const tiersToInsert = pricing_tiers.map(({ id: _tid, created_at: _tca, ...tier }: any) => ({
            ...tier,
            package_id: newPkg.id,
          }))
          await serviceSupabase.from("package_pricing_tiers").insert(tiersToInsert)
        }

        // Duplicate add-ons
        if (addons && addons.length > 0) {
          const addonsToInsert = addons.map(({ id: _aid, created_at: _aca, ...addon }: any) => ({
            ...addon,
            package_id: newPkg.id,
          }))
          await serviceSupabase.from("package_addons").insert(addonsToInsert)
        }
      }
    }

    return NextResponse.json({ success: true, id: newExperience.id, slug: newExperience.slug })
  } catch (error) {
    console.error("Unexpected duplicate error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
