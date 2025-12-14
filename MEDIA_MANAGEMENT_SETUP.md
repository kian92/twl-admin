# Media Management with Bunny.net CDN

## Overview

Complete media management system integrated with Bunny.net CDN for uploading, storing, and displaying images and videos on both admin and consumer-facing sites.

## Features

### Admin Site (twl-admin)
- ✅ Upload images (JPG, PNG, GIF, WebP)
- ✅ Upload videos (MP4, WebM, MOV)
- ✅ Automatic CDN distribution via Bunny.net
- ✅ Video streaming via Bunny Stream
- ✅ Tag management for categorization
- ✅ Public/private visibility toggle
- ✅ Media preview and lightbox
- ✅ Delete media with CDN cleanup
- ✅ Filter by type (images/videos/all)

### Consumer Site (wandering-lens)
- ✅ Public media gallery at `/gallery`
- ✅ Lightbox view for images
- ✅ Video player with Bunny Stream
- ✅ Filter by tags
- ✅ Responsive grid layout
- ✅ Only shows public media

## Setup Instructions

### Step 1: Create Bunny.net Account

1. Go to [bunny.net](https://bunny.net) and sign up
2. Verify your email

### Step 2: Create Storage Zone

1. In Bunny dashboard, go to **Storage** → **Add Storage Zone**
2. Choose a name (e.g., `twl-media`)
3. Select region (closest to your users)
4. Note down:
   - Storage Zone Name
   - Storage Hostname (e.g., `storage.bunnycdn.com`)

5. Click on your storage zone → **FTP & API Access**
6. Copy the **Password** (this is your Storage API Key)

### Step 3: Create Pull Zone (CDN)

1. Go to **Pull Zones** → **Add Pull Zone**
2. Choose a name (e.g., `twl-cdn`)
3. Under **Origin**, select **Storage Zone**
4. Select your storage zone created in Step 2
5. Click **Add Pull Zone**
6. Note down the **Pull Zone URL** (e.g., `https://twl-cdn.b-cdn.net`)

### Step 4: Create Stream Library (Optional - For Videos)

1. Go to **Stream** → **Add Library**
2. Choose a name (e.g., `twl-videos`)
3. Select region
4. Note down:
   - Library ID
   - Stream API Key (from library settings)

### Step 5: Configure Environment Variables

Add these to your `.env.local` file in the **admin site** (`twl-admin`):

```env
# Bunny.net Storage Configuration
BUNNY_STORAGE_ZONE_NAME=twl-media
BUNNY_STORAGE_API_KEY=your-storage-api-key-here
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com

# Bunny.net Pull Zone (CDN)
BUNNY_PULL_ZONE_URL=https://twl-cdn.b-cdn.net

# Bunny.net Stream (for videos)
BUNNY_STREAM_LIBRARY_ID=your-library-id-here
BUNNY_STREAM_API_KEY=your-stream-api-key-here
```

### Step 6: Run Database Migration

Run the media library migration in Supabase SQL Editor:

```bash
# Navigate to admin site
cd twl-admin

# The migration file is at:
supabase/migrations/20251214_create_media_library.sql
```

Or run directly in Supabase:

```sql
-- Copy and paste the contents of 20251214_create_media_library.sql
-- into your Supabase SQL Editor and execute
```

### Step 7: Update Database Types

If using TypeScript types, regenerate them:

```bash
# In twl-admin directory
npx supabase gen types typescript --local > types/database.ts
```

Or add the media_library types manually to `types/database.ts`.

### Step 8: Test Upload

1. Start the admin site: `npm run dev`
2. Go to `/admin/media`
3. Click "Upload Media"
4. Upload a test image
5. Verify it appears in the media library
6. Check that the CDN URL works

### Step 9: Configure Consumer Site

The consumer site shares the same Supabase database, so no additional configuration is needed. Just ensure it can access the media API.

## File Structure

### Admin Site (`twl-admin`)

```
twl-admin/
├── lib/bunny/
│   ├── config.ts           # Bunny.net configuration
│   └── storage.ts          # Bunny.net API client
├── app/api/media/
│   ├── route.ts            # List & update media
│   ├── upload/route.ts     # Upload handler
│   └── [id]/route.ts       # Delete media
├── app/admin/media/
│   └── page.tsx            # Media management UI
└── supabase/migrations/
    └── 20251214_create_media_library.sql
```

### Consumer Site (`wandering-lens`)

```
wandering-lens/
├── components/
│   └── media-gallery.tsx   # Media gallery component
├── app/api/media/
│   └── route.ts            # Public media API
└── app/gallery/
    └── page.tsx            # Gallery page
```

## Usage

### Admin: Upload Media

1. Go to `/admin/media`
2. Click "Upload Media"
3. Select file (image or video)
4. Enter title and description
5. Add tags (comma-separated): `adventure, bali, sunset`
6. Toggle "Show on Consumer Site" if you want it public
7. Click "Upload"
8. File is uploaded to Bunny.net and saved to database

### Admin: Manage Media

- **Toggle Public/Private**: Click eye icon
- **Download**: Click download icon
- **Delete**: Click trash icon (removes from CDN and database)
- **Filter**: Use dropdown to show images only, videos only, or all

### Consumer: View Gallery

Users can visit `/gallery` to see all public media in a beautiful grid layout with lightbox functionality.

## Database Schema

### media_library Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Media title |
| description | TEXT | Optional description |
| file_name | TEXT | Original filename |
| file_type | TEXT | 'image' or 'video' |
| mime_type | TEXT | MIME type (image/jpeg, video/mp4, etc.) |
| file_size | INTEGER | File size in bytes |
| cdn_url | TEXT | Full Bunny CDN URL |
| bunny_video_id | TEXT | Bunny Stream video ID (videos only) |
| thumbnail_url | TEXT | Video thumbnail URL |
| width | INTEGER | Image/video width |
| height | INTEGER | Image/video height |
| duration | INTEGER | Video duration in seconds |
| tags | TEXT[] | Array of tags |
| is_public | BOOLEAN | Show on consumer site |
| display_order | INTEGER | Custom ordering |
| uploaded_by | TEXT | Admin who uploaded |
| created_at | TIMESTAMP | Upload timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

## API Endpoints

### Admin Site

#### POST `/api/media/upload`
Upload a new image or video.

**Body (FormData):**
- `file`: File (required)
- `title`: string (required)
- `description`: string (optional)
- `tags`: string (comma-separated, optional)
- `isPublic`: boolean (default: true)

**Response:**
```json
{
  "success": true,
  "media": { /* media object */ },
  "message": "Image uploaded successfully"
}
```

#### GET `/api/media`
List all media with optional filters.

**Query Parameters:**
- `fileType`: 'image' | 'video' (optional)
- `isPublic`: 'true' | 'false' (optional)

**Response:**
```json
{
  "media": [ /* array of media objects */ ]
}
```

#### PATCH `/api/media`
Update media details.

**Body:**
```json
{
  "id": "uuid",
  "title": "New Title",
  "description": "New description",
  "tags": ["tag1", "tag2"],
  "isPublic": true,
  "displayOrder": 1
}
```

#### DELETE `/api/media/[id]`
Delete media from CDN and database.

**Response:**
```json
{
  "message": "Media deleted successfully"
}
```

### Consumer Site

#### GET `/api/media`
Get public media only.

**Query Parameters:**
- `fileType`: 'image' | 'video' (optional)
- `tag`: Filter by tag (optional)

**Response:**
```json
{
  "media": [ /* array of public media */ ]
}
```

## Components

### MediaGallery Component

Reusable component for displaying media galleries.

**Props:**
```typescript
interface MediaGalleryProps {
  filterTag?: string;      // Filter by specific tag
  limit?: number;          // Limit number of items
  showVideos?: boolean;    // Show videos (default: true)
  showImages?: boolean;    // Show images (default: true)
}
```

**Usage:**
```tsx
// Show all public media
<MediaGallery />

// Show only images
<MediaGallery showVideos={false} />

// Show only media with "bali" tag
<MediaGallery filterTag="bali" />

// Limit to 6 items
<MediaGallery limit={6} />
```

## Bunny.net Pricing

### Storage
- $0.01 per GB/month
- First 500GB free for 1 year

### CDN Bandwidth
- $0.01 - $0.03 per GB (varies by region)
- First 100GB free

### Stream (Videos)
- $0.005 per GB encoded
- $0.01 per GB delivered
- Automatic transcoding included

**Estimated Costs for 1000 images/videos:**
- Storage: ~10GB = $0.10/month
- CDN: 1000 views = ~5GB = $0.05-$0.15
- Stream: 100 video views = ~2GB = $0.02

**Total: ~$0.20-$0.30/month for moderate traffic**

## Troubleshooting

### Upload Fails with "Bunny.net configuration is incomplete"

**Solution:** Check that all environment variables are set correctly in `.env.local`:
```bash
BUNNY_STORAGE_ZONE_NAME=your-zone-name
BUNNY_STORAGE_API_KEY=your-api-key
BUNNY_PULL_ZONE_URL=https://your-cdn.b-cdn.net
```

### Images Upload but Don't Display

**Solution:**
1. Check the CDN URL in database matches your Pull Zone URL
2. Verify Pull Zone is connected to Storage Zone in Bunny dashboard
3. Wait 1-2 minutes for CDN propagation

### Videos Don't Play

**Solution:**
1. Verify you created a Bunny Stream library
2. Check `BUNNY_STREAM_LIBRARY_ID` and `BUNNY_STREAM_API_KEY` are set
3. Videos take 2-5 minutes to process after upload
4. Check video format is supported (MP4 recommended)

### "Failed to delete from Bunny" Error

**Solution:**
- This warning appears but deletion continues
- Media is removed from database even if CDN deletion fails
- Manually delete from Bunny dashboard if needed

### Consumer Site Shows No Media

**Solution:**
1. Run the database migration
2. Check media has `is_public = true`
3. Verify consumer site can connect to Supabase
4. Check browser console for API errors

## Advanced Features

### Custom Folders

Organize media in folders by modifying upload:

```typescript
// In upload API
uploadToBunny({
  fileName,
  file,
  contentType,
  folder: "experiences/bali", // Custom folder path
});
```

### Image Optimization

Add Bunny image processing:

```typescript
// Add query parameters to CDN URL
const optimizedUrl = `${cdnUrl}?width=800&quality=85`;
```

### Video Thumbnails

Custom video thumbnails at specific timestamps:

```
https://vz-{library-id}.b-cdn.net/{video-id}/thumbnail.jpg?time=5.0
```

### Batch Upload

Extend upload API to accept multiple files:

```typescript
const files = formData.getAll("files") as File[];
for (const file of files) {
  // Upload each file
}
```

## Security

### Authentication

Currently, media upload requires admin access. Implement proper authentication:

```typescript
// Add to upload route
const session = await getServerSession();
if (!session?.user?.role === "admin") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### File Validation

- File size limited to 500MB
- Only allowed MIME types accepted
- Filename sanitization applied
- SQL injection prevented (using parameterized queries)

### CDN Security

- Consider enabling Bunny.net token authentication for sensitive media
- Set up IP restrictions in Bunny dashboard if needed
- Use HTTPS only (automatic with Bunny)

## Next Steps

- [ ] Add image editing (crop, resize)
- [ ] Implement folder organization
- [ ] Add bulk upload
- [ ] Create media picker for experiences
- [ ] Add watermarking for images
- [ ] Implement video chapters/clips
- [ ] Add analytics (view counts, popular media)
- [ ] Create media collections/albums
