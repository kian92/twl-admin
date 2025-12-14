# Bunny.net Setup Checklist

Quick setup guide to get media management working.

## ☑️ Pre-Setup Checklist

- [ ] Have a Bunny.net account (sign up at https://bunny.net)
- [ ] Have access to Supabase dashboard
- [ ] Have admin access to both twl-admin and wandering-lens codebases

## 📝 Setup Steps

### 1. Bunny.net Configuration (15 minutes)

- [ ] **Create Storage Zone**
  - Go to Bunny Dashboard → Storage → Add Storage Zone
  - Name: `twl-media` (or your choice)
  - Region: Choose closest to your users
  - Save Storage Zone Name: `_________________`
  - Save Storage API Key: `_________________`

- [ ] **Create Pull Zone (CDN)**
  - Go to Pull Zones → Add Pull Zone
  - Name: `twl-cdn` (or your choice)
  - Origin: Select "Storage Zone"
  - Link to your storage zone created above
  - Save Pull Zone URL: `_________________`
  - Example: `https://twl-cdn.b-cdn.net`

- [ ] **Create Stream Library (Optional - for videos)**
  - Go to Stream → Add Library
  - Name: `twl-videos` (or your choice)
  - Region: Choose closest to your users
  - Save Library ID: `_________________`
  - Save Stream API Key: `_________________`

### 2. Environment Variables (5 minutes)

- [ ] **Add to `.env.local` in twl-admin:**

```env
# Required
BUNNY_STORAGE_ZONE_NAME=twl-media
BUNNY_STORAGE_API_KEY=your-storage-api-key-here
BUNNY_STORAGE_HOSTNAME=storage.bunnycdn.com
BUNNY_PULL_ZONE_URL=https://twl-cdn.b-cdn.net

# Optional (if using videos)
BUNNY_STREAM_LIBRARY_ID=your-library-id-here
BUNNY_STREAM_API_KEY=your-stream-api-key-here
```

- [ ] **Restart dev server** to load new environment variables

### 3. Database Migration (2 minutes)

- [ ] **Run migration in Supabase SQL Editor:**
  1. Open Supabase Dashboard
  2. Go to SQL Editor
  3. Open file: `supabase/migrations/20251214_create_media_library.sql`
  4. Copy contents and paste into SQL Editor
  5. Click "Run"
  6. Verify success ✅

### 4. Test Upload (5 minutes)

- [ ] **Admin Site Test:**
  1. Start admin site: `npm run dev`
  2. Navigate to `/admin/media`
  3. Click "Upload Media"
  4. Upload a test image (JPG/PNG)
  5. Check that it appears in the media library
  6. Click the download icon to verify CDN URL works
  7. Toggle public/private switch
  8. Try deleting the test image

- [ ] **Consumer Site Test:**
  1. Start consumer site: `npm run dev`
  2. Navigate to `/gallery`
  3. Verify test images appear (only if marked as public)
  4. Click an image to open lightbox
  5. Verify image loads correctly

### 5. Optional: Video Upload Test

- [ ] **If using Bunny Stream:**
  1. Upload a test video (MP4 recommended)
  2. Wait 2-5 minutes for processing
  3. Check video appears with play button
  4. Click to verify video plays

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] Images upload successfully
- [ ] Images display in admin media library
- [ ] CDN URLs work when opened directly
- [ ] Public images appear on consumer site gallery
- [ ] Private images do NOT appear on consumer site
- [ ] Public/private toggle works
- [ ] Delete function removes media
- [ ] Filter by type (image/video) works
- [ ] Tags are saved and displayed
- [ ] Lightbox opens on consumer site

## 🎯 Expected Results

### Admin Site (`/admin/media`)
- Upload button visible
- Media grid displays uploaded files
- Can toggle public/private
- Can delete media
- Can filter by type

### Consumer Site (`/gallery`)
- Public media displays in grid
- Click opens lightbox
- Only public media visible
- Responsive on mobile

## 🐛 Troubleshooting

### Problem: "Bunny.net configuration is incomplete"

**Solution:**
- Check all environment variables are set in `.env.local`
- Restart dev server after adding variables
- Verify variable names match exactly

### Problem: Upload succeeds but image doesn't show

**Solution:**
- Wait 1-2 minutes for CDN propagation
- Check CDN URL in database matches your Pull Zone URL
- Verify Pull Zone is connected to Storage Zone in Bunny dashboard

### Problem: Consumer site shows no media

**Solution:**
- Ensure media is marked as public (`is_public = true`)
- Run database migration if not done
- Check browser console for API errors
- Verify Supabase connection works

### Problem: Videos don't play

**Solution:**
- Ensure Bunny Stream library is created
- Check `BUNNY_STREAM_LIBRARY_ID` is correct
- Wait 2-5 minutes for video processing
- Use MP4 format for best compatibility

## 📞 Support

If you encounter issues:

1. Check [MEDIA_MANAGEMENT_SETUP.md](MEDIA_MANAGEMENT_SETUP.md) for detailed documentation
2. Review Bunny.net dashboard for errors
3. Check browser console for API errors
4. Verify database migration ran successfully
5. Check Supabase logs for errors

## 🚀 Next Steps

After successful setup:

- [ ] Upload your actual media files
- [ ] Organize with tags
- [ ] Test on staging environment
- [ ] Set up production environment with production Bunny account
- [ ] Configure domain custom CDN URL (optional)
- [ ] Set up image optimization parameters (optional)

## 📊 Estimated Setup Time

- **Bunny.net Setup**: 15 minutes
- **Environment Variables**: 5 minutes
- **Database Migration**: 2 minutes
- **Testing**: 5 minutes
- **Total**: ~30 minutes

## 💰 Cost Estimate

For typical usage:
- **Free Tier**: 500GB storage + 100GB bandwidth
- **Beyond Free**: ~$0.01 per GB storage, $0.01-$0.03 per GB bandwidth
- **Expected for 1000 images**: ~$0.20-$0.30/month

---

**Setup Complete!** ✅

Your media management system is now ready to use. Upload your first media file in `/admin/media` and see it appear on `/gallery`!
