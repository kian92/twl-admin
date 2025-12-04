import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payload = await request.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Check if link_code already exists for a different payment link
    if (payload.link_code) {
      const { data: existing } = await supabase
        .from("payment_links")
        .select("id")
        .eq("link_code", payload.link_code)
        .neq("id", id)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: "Link code already exists. Please use a different code." },
          { status: 400 }
        );
      }
    }

    // Update the payment link
    const { data, error } = await supabase
      .from("payment_links")
      // @ts-expect-error - Supabase type inference issue
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update payment link", error);
      return NextResponse.json({ error: "Failed to update payment link" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected payment link update error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase.from("payment_links").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete payment link", error);
      return NextResponse.json({ error: "Failed to delete payment link" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unexpected payment link deletion error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
