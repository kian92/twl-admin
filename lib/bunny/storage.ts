// Bunny.net Storage API Client
import { bunnyConfig, bunnyStorageEndpoint } from "./config";

export interface UploadOptions {
  fileName: string;
  file: Buffer | Blob | File;
  contentType: string;
  folder?: string;
}

export interface BunnyFile {
  Guid: string;
  StorageZoneName: string;
  Path: string;
  ObjectName: string;
  Length: number;
  LastChanged: string;
  IsDirectory: boolean;
  ServerId: number;
  UserId: string;
  DateCreated: string;
  StorageZoneId: number;
  Checksum: string | null;
  ReplicatedZones: string | null;
}

/**
 * Upload file to Bunny.net Storage
 */
export async function uploadToBunny(options: UploadOptions): Promise<string> {
  const { fileName, file, contentType, folder } = options;

  // Construct path: {BUNNY_FOLDER}/images/{filename}
  // e.g., "development/images/photo.jpg"
  const baseFolder = bunnyConfig.folder; // e.g., "development"
  const subFolder = folder || "images"; // default to "images"
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const filePath = `/${baseFolder}/${subFolder}/${sanitizedFileName}`;

  // Convert file to buffer if needed
  let buffer: Buffer;
  if (file instanceof Buffer) {
    buffer = file;
  } else if (file instanceof Blob || file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    throw new Error("Unsupported file type");
  }

  const url = `${bunnyStorageEndpoint}${filePath}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      AccessKey: bunnyConfig.storageApiKey,
      "Content-Type": contentType,
    },
    body: buffer as any,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bunny upload failed: ${response.status} - ${errorText}`);
  }

  // Return the CDN URL
  const cdnUrl = `${bunnyConfig.cdnHost}${filePath}`;
  return cdnUrl;
}

/**
 * Delete file from Bunny.net Storage
 */
export async function deleteFromBunny(filePath: string): Promise<void> {
  const url = `${bunnyStorageEndpoint}${filePath}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      AccessKey: bunnyConfig.storageApiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bunny delete failed: ${response.status} - ${errorText}`);
  }
}

/**
 * List files in a directory
 */
export async function listBunnyFiles(folder: string = ""): Promise<BunnyFile[]> {
  const url = `${bunnyStorageEndpoint}/${folder}/`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      AccessKey: bunnyConfig.storageApiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bunny list failed: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Upload video to Bunny Stream
 */
export async function uploadVideoToBunnyStream(
  title: string,
  file: Buffer | Blob | File
): Promise<{ videoId: string; cdnUrl: string }> {
  const url = `https://video.bunnycdn.com/library/${bunnyConfig.streamLibraryId}/videos`;

  // Create video
  const createResponse = await fetch(url, {
    method: "POST",
    headers: {
      AccessKey: bunnyConfig.streamApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!createResponse.ok) {
    throw new Error("Failed to create video on Bunny Stream");
  }

  const { guid: videoId } = await createResponse.json();

  // Upload video file
  let buffer: Buffer;
  if (file instanceof Buffer) {
    buffer = file;
  } else if (file instanceof Blob || file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    throw new Error("Unsupported file type");
  }

  const uploadUrl = `https://video.bunnycdn.com/library/${bunnyConfig.streamLibraryId}/videos/${videoId}`;
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: bunnyConfig.streamApiKey,
    },
    body: buffer as any,
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload video to Bunny Stream");
  }

  const cdnUrl = `https://iframe.mediadelivery.net/embed/${bunnyConfig.streamLibraryId}/${videoId}`;

  return { videoId, cdnUrl };
}
