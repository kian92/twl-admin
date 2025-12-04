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

    // Fetch submissions with payment link info
    const { data, error } = await supabase
      .from("payment_submissions")
      .select(`
        *,
        payment_links:payment_link_id (
          id,
          title,
          destination,
          link_code,
          price,
          currency,
          created_by
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch payment submissions", error);
      return NextResponse.json(
        { error: "Failed to fetch payment submissions" },
        { status: 500 }
      );
    }

    // Enrich with admin information
    const submissionsWithAdmin = await Promise.all(
      (data || []).map(async (submission: any) => {
        if (submission.payment_links?.created_by) {
          // Get admin profile
          const { data: adminProfile } = await supabase
            .from("admin_profiles")
            .select("id, full_name")
            .eq("id", submission.payment_links.created_by)
            .single();

          // Get admin email from auth.users
          const { data: userData } = await supabase.auth.admin.getUserById(
            submission.payment_links.created_by
          );

          return {
            ...submission,
            payment_links: {
              ...submission.payment_links,
              admin_email: userData?.user?.email || null,
              admin_profiles: adminProfile || null,
            },
          };
        }
        return submission;
      })
    );

    return NextResponse.json(submissionsWithAdmin);
  } catch (error) {
    console.error("Unexpected payment submissions fetch error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
