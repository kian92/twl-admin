import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("payment_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch payment links", error);
      return NextResponse.json({ error: "Failed to fetch payment links" }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Unexpected payment links fetch error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Check if link_code already exists
    const { data: existing } = await supabase
      .from("payment_links")
      .select("id")
      .eq("link_code", payload.link_code)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "Link code already exists. Please use a different code." },
        { status: 400 }
      );
    }

    // Create the payment link
    const { data, error } = await supabase
      .from("payment_links")
      .insert({
        ...payload,
        created_by: session.user.id,
        current_uses: 0,
        status: payload.status || "active",
        currency: payload.currency || "USD",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to create payment link", error);
      return NextResponse.json({ error: "Failed to create payment link" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected payment link creation error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
