import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { testimonialPayloadSchema, normalizeTestimonialPayload } from "@/lib/validations/testimonial"

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch testimonials", error)
      return NextResponse.json({ error: "Failed to fetch testimonials" }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error("Unexpected testimonials fetch error", error)
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

    const parsed = testimonialPayloadSchema.safeParse(payload)
    if (!parsed.success) {
      const issue = parsed.error.errors.at(0)
      return NextResponse.json({ error: issue?.message ?? "Validation failed" }, { status: 400 })
    }

    const normalized = normalizeTestimonialPayload(parsed.data)

    const { data, error } = await supabase
      .from("testimonials")
      .insert(normalized)
      .select("id")
      .single()

    if (error) {
      console.error("Failed to create testimonial", error)
      return NextResponse.json({ error: "Failed to create testimonial" }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (error) {
    console.error("Unexpected testimonial creation error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
