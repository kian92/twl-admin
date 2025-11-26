import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = `${Date.now()}-${file.name}`;

    const storageZone = process.env.BUNNY_STORAGE_ZONE!;
    const apiKey = process.env.BUNNY_STORAGE_API_KEY!;
    const region = process.env.BUNNY_STORAGE_REGION || "sg"; // Singapore

    const folder = process.env.BUNNY_FOLDER || "development";

    const uploadUrl = `https://${region}.storage.bunnycdn.com/${storageZone}/${folder}/${fileName}`;

    const uploadRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        AccessKey: apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: Buffer.from(await file.arrayBuffer()),
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      console.log("Bunny Upload Error:", error);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const cdnHost = process.env.NEXT_PUBLIC_BUNNY_CDN_HOST!.replace("https://", "");
    const cdnUrl = `https://${cdnHost}/${folder}/${fileName}`;

    return NextResponse.json({ url: cdnUrl });
  } catch (error) {
    console.log("Server error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
