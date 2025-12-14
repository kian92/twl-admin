import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteFromBunny } from "@/lib/bunny/storage";
import { bunnyConfig } from "@/lib/bunny/config";
import { canAccessMedia } from "@/lib/auth/roles";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// DELETE - Delete media
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication and authorization
    const hasAccess = await canAccessMedia();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized. Only admin and manager roles can delete media." },
        { status: 403 }
      );
    }
    const { id } = await params;

    // Get media details first
    const { data: media, error: fetchError } = await supabase
      .from("media_library")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !media) {
      return NextResponse.json({ error: "Media not found" }, { status: 404 });
    }

    // Delete from Bunny CDN
    try {
      if (media.file_type === "video" && media.bunny_video_id) {
        // Delete from Bunny Stream
        const deleteUrl = `https://video.bunnycdn.com/library/${bunnyConfig.streamLibraryId}/videos/${media.bunny_video_id}`;
        await fetch(deleteUrl, {
          method: "DELETE",
          headers: {
            AccessKey: bunnyConfig.streamApiKey,
          },
        });
      } else {
        // Delete from Bunny Storage
        // Extract path from CDN URL
        const urlPath = new URL(media.cdn_url).pathname;
        await deleteFromBunny(urlPath);
      }
    } catch (bunnyError) {
      console.error("Failed to delete from Bunny:", bunnyError);
      // Continue with DB deletion even if Bunny deletion fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("media_library")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Failed to delete media from database:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete media" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Media deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete media" },
      { status: 500 }
    );
  }
}
