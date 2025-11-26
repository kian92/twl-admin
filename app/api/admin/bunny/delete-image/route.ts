import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    console.log('url', url);
    

    // Example URL:
    // https://twl-media.b-cdn.net/development/12345-photo.png

    const cdnHost = process.env.NEXT_PUBLIC_BUNNY_CDN_HOST!; // twl-media.b-cdn.net
    const storageZone = process.env.BUNNY_STORAGE_ZONE!;
    const apiKey = process.env.BUNNY_STORAGE_API_KEY!;
    const region = process.env.BUNNY_STORAGE_REGION || "sg";

    // Extract folder + filename from URL
    const path = url.replace(`https://${cdnHost}/`, "");  
    // → development/12345-photo.png

    const deleteUrl = `https://${region}.storage.bunnycdn.com/${storageZone}/${path}`;

    const deleteRes = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        AccessKey: apiKey,
      },
    });

    if (!deleteRes.ok) {
      const error = await deleteRes.text();
      console.error("Bunny Delete Error:", error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
