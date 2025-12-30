// Bunny.net Storage Configuration
// https://docs.bunny.net/docs/stream-api-upload-videos

export const bunnyConfig = {
  // Storage API
  storageZone: process.env.BUNNY_STORAGE_ZONE || "",
  storageApiKey: process.env.BUNNY_STORAGE_API_KEY || "",
  storageEndpoint: process.env.BUNNY_STORAGE_ENDPOINT || "storage.bunnycdn.com",
  storageRegion: process.env.BUNNY_STORAGE_REGION || "",

  // CDN/Pull Zone
  cdnHost: process.env.BUNNY_CDN_HOST || process.env.NEXT_PUBLIC_BUNNY_CDN_HOST || "",

  // Folder structure
  folder: process.env.BUNNY_FOLDER || "media",

  // Stream (for videos - optional)
  streamLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID || "",
  streamApiKey: process.env.BUNNY_STREAM_API_KEY || "",
};

// Construct storage endpoint with region if provided
const storageHost = bunnyConfig.storageRegion
  ? `${bunnyConfig.storageRegion}.${bunnyConfig.storageEndpoint}`
  : bunnyConfig.storageEndpoint;

export const bunnyStorageEndpoint = `https://${storageHost}/${bunnyConfig.storageZone}`;
export const bunnyStreamEndpoint = `https://video.bunnycdn.com/library/${bunnyConfig.streamLibraryId}/videos`;

// Validate configuration
export function validateBunnyConfig() {
  const required = [
    "storageZone",
    "storageApiKey",
    "cdnHost",
  ];

  const missing = required.filter((key) => !bunnyConfig[key as keyof typeof bunnyConfig]);

  if (missing.length > 0) {
    console.warn(`Missing Bunny.net config: ${missing.join(", ")}`);
    return false;
  }

  return true;
}
