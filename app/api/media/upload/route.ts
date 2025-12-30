import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { uploadToBunny, uploadVideoToBunnyStream } from "@/lib/bunny/storage";
import { validateBunnyConfig } from "@/lib/bunny/config";
import { canAccessMedia, getUserProfile } from "@/lib/auth/roles";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export async function POST(request: Request) {
  try {
    // Check authentication and authorization
    const hasAccess = await canAccessMedia();
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized. Only admin and manager roles can upload media." },
        { status: 403 }
      );
    }

    const userProfile = await getUserProfile();
    // Validate Bunny config
    if (!validateBunnyConfig()) {
      return NextResponse.json(
        { error: "Bunny.net configuration is incomplete" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const tags = formData.get("tags") as string; // Comma-separated
    const isPublic = formData.get("isPublic") !== "false";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 500MB limit" },
        { status: 400 }
      );
    }

    // Determine file type
    const mimeType = file.type;
    let fileType: "image" | "video";

    if (ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      fileType = "image";
    } else if (ALLOWED_VIDEO_TYPES.includes(mimeType)) {
      fileType = "video";
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload images (JPG, PNG, GIF, WebP) or videos (MP4, WebM, MOV)" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const fileName = `${timestamp}-${sanitizedOriginalName}`;

    let cdnUrl: string;
    let bunnyVideoId: string | null = null;
    let thumbnailUrl: string | null = null;

    // Upload based on file type
    if (fileType === "video") {
      // Upload to Bunny Stream for videos
      const result = await uploadVideoToBunnyStream(title, file);
      cdnUrl = result.cdnUrl;
      bunnyVideoId = result.videoId;
      thumbnailUrl = `https://vz-${process.env.BUNNY_STREAM_LIBRARY_ID}.b-cdn.net/${result.videoId}/thumbnail.jpg`;
    } else {
      // Upload to Bunny Storage for images
      try {
        cdnUrl = await uploadToBunny({
          fileName,
          file,
          contentType: mimeType,
          folder: fileType === "image" ? "images" : "videos",
        });
        console.log('Image uploaded successfully, CDN URL:', cdnUrl);
      } catch (uploadError) {
        console.error('Failed to upload to Bunny:', uploadError);
        throw uploadError;
      }
    }

    // Parse tags
    const tagsArray = tags ? tags.split(",").map((tag) => tag.trim()).filter(Boolean) : [];

    // Save to database
    const { data: media, error: dbError } = await supabase
      .from("media_library")
      .insert({
        title,
        description: description || null,
        file_name: fileName,
        file_type: fileType,
        mime_type: mimeType,
        file_size: file.size,
        cdn_url: cdnUrl,
        bunny_video_id: bunnyVideoId,
        thumbnail_url: thumbnailUrl,
        tags: tagsArray,
        is_public: isPublic,
        uploaded_by: userProfile?.full_name || userProfile?.id || "Unknown"
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.json(
        { error: "Failed to save media to database" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        media,
        message: `${fileType === "image" ? "Image" : "Video"} uploaded successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
