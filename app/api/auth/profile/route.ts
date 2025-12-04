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

    // Get user profile with role
    const { data: profile, error } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Failed to fetch user profile", error);
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: profile.id,
      email: session.user.email,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url,
      is_active: profile.is_active,
    });
  } catch (error) {
    console.error("Unexpected error fetching profile", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
