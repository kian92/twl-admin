import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { canAccessMedia } from "@/lib/auth/roles";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - List all media
export async function GET(request: Request) {
  try {
    // Check authentication and authorization
    const hasAccess = await canAccessMedia();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized. Only admin and manager roles can access media." },
        { status: 403 }
      );
    }
    const url = new URL(request.url);
    const fileType = url.searchParams.get("fileType"); // 'image' or 'video' or null for all
    const isPublic = url.searchParams.get("isPublic"); // 'true' or 'false' or null for all

    let query = supabase
      .from("media_library")
      .select("*")
      .order("created_at", { ascending: false });

    if (fileType) {
      query = query.eq("file_type", fileType);
    }

    if (isPublic !== null) {
      query = query.eq("is_public", isPublic === "true");
    }

    const { data: media, error } = await query;

    if (error) {
      console.error("Failed to fetch media:", error);
      return NextResponse.json(
        { error: "Failed to fetch media" },
        { status: 500 }
      );
    }

    return NextResponse.json({ media }, { status: 200 });
  } catch (error) {
    console.error("Error fetching media:", error);
    return NextResponse.json(
      { error: "Failed to fetch media" },
      { status: 500 }
    );
  }
}

// PATCH - Update media details
export async function PATCH(request: Request) {
  try {
    // Check authentication and authorization
    const hasAccess = await canAccessMedia();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized. Only admin and manager roles can update media." },
        { status: 403 }
      );
    }
    const body = await request.json();
    const { id, title, description, tags, isPublic, displayOrder } = body;

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
    }

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (tags !== undefined) updates.tags = tags;
    if (isPublic !== undefined) updates.is_public = isPublic;
    if (displayOrder !== undefined) updates.display_order = displayOrder;

    const { data: media, error } = await supabase
      .from("media_library")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update media:", error);
      return NextResponse.json(
        { error: "Failed to update media" },
        { status: 500 }
      );
    }

    return NextResponse.json({ media, message: "Media updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating media:", error);
    return NextResponse.json(
      { error: "Failed to update media" },
      { status: 500 }
    );
  }
}
