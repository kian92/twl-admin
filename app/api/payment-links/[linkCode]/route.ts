import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface RouteParams {
  params: Promise<{ linkCode: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const supabase = await createSupabaseServerClient();
    const { linkCode } = await params;

    const { data, error } = await supabase
      .from("payment_links")
      .select("*")
      .eq("link_code", linkCode)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Unexpected payment link fetch error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
