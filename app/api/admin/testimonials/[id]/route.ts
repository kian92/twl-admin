import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { testimonialPayloadSchema, normalizeTestimonialPayload } from "@/lib/validations/testimonial"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: RouteParams) {
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
      .from("testimonials")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Failed to fetch testimonial", error)
      return NextResponse.json({ error: "Failed to fetch testimonial" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected testimonial fetch error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
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
      .update(normalized)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Failed to update testimonial", error)
      return NextResponse.json({ error: "Failed to update testimonial" }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Unexpected testimonial update error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
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
      .from("testimonials")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Failed to delete testimonial", error)
      return NextResponse.json({ error: "Failed to delete testimonial" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unexpected testimonial deletion error", error)
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 })
  }
}
