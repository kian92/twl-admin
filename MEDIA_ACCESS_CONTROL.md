# Media Library Access Control

## Overview

The media library is restricted to **Admin** and **Manager** roles only. Support and Sales staff cannot access media management features.

## Role-Based Access

### ✅ Can Access Media Library:
- **Admin** - Full access to all media features
- **Manager** - Full access to all media features

### ❌ Cannot Access Media Library:
- **Support** - No access
- **Sales** - No access

## Implementation

### 1. Menu Item Visibility

**File:** `lib/auth/roles.ts` (Line 99)

The "Media Library" menu item only appears for admin and manager roles:

```typescript
{ name: "Media Library", href: "/admin/media", roles: ["admin", "manager"] }
```

### 2. Page-Level Access Control

**File:** `lib/auth/roles.ts` (Lines 81-89)

The `hasAccessToPage()` function checks pathname access:

```typescript
// Manager has access to everything except settings
if (role === "manager") {
  return !pathname.startsWith("/admin/settings");
}

// Support has access to everything except settings and media
if (role === "support") {
  return !pathname.startsWith("/admin/settings") &&
         !pathname.startsWith("/admin/media");
}
```

### 3. API Endpoint Protection

All media API endpoints check authorization using `canAccessMedia()`:

#### Upload Endpoint
**File:** `app/api/media/upload/route.ts` (Lines 18-25)

```typescript
const hasAccess = await canAccessMedia();
if (!hasAccess) {
  return NextResponse.json(
    { error: "Unauthorized. Only admin and manager roles can upload media." },
    { status: 403 }
  );
}
```

#### List Endpoint
**File:** `app/api/media/route.ts` (Lines 13-20)

```typescript
const hasAccess = await canAccessMedia();
if (!hasAccess) {
  return NextResponse.json(
    { error: "Unauthorized. Only admin and manager roles can access media." },
    { status: 403 }
  );
}
```

#### Update Endpoint
**File:** `app/api/media/route.ts` (Lines 61-68)

```typescript
const hasAccess = await canAccessMedia();
if (!hasAccess) {
  return NextResponse.json(
    { error: "Unauthorized. Only admin and manager roles can update media." },
    { status: 403 }
  );
}
```

#### Delete Endpoint
**File:** `app/api/media/[id]/route.ts` (Lines 18-25)

```typescript
const hasAccess = await canAccessMedia();
if (!hasAccess) {
  return NextResponse.json(
    { error: "Unauthorized. Only admin and manager roles can delete media." },
    { status: 403 }
  );
}
```

### 4. Frontend Protection

**File:** `app/admin/media/page.tsx` (Lines 73-79, 199-217)

The page detects 403 responses and redirects unauthorized users:

```typescript
if (res.status === 403) {
  setUnauthorized(true);
  toast.error("Access denied. Only admin and manager roles can access media.");
  router.push("/admin");
  return;
}
```

Shows access denied message:

```typescript
if (unauthorized) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">
            Only admin and manager roles can access the media library.
          </p>
          <Button onClick={() => router.push("/admin")}>
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5. Upload Tracking

**File:** `app/api/media/upload/route.ts` (Line 118)

Media uploads are tracked with the user's full name:

```typescript
uploaded_by: userProfile?.full_name || userProfile?.id || "Unknown"
```

This allows audit trails to show who uploaded each media file.

## Authorization Flow

```
User attempts to access /admin/media
          ↓
Menu checks user role
  → Admin/Manager: Show "Media Library" link ✅
  → Support/Sales: Hide link ❌
          ↓
User navigates to /admin/media
          ↓
Page loads and calls /api/media
          ↓
API checks canAccessMedia()
          ↓
getUserRole() from admin_profiles table
          ↓
Is role "admin" or "manager"?
  → Yes: Return media data ✅
  → No: Return 403 Forbidden ❌
          ↓
Frontend receives response
  → 200 OK: Display media library
  → 403 Forbidden: Show access denied + redirect
```

## Security Layers

### Layer 1: UI/UX
- Menu item hidden from unauthorized roles
- Prevents casual access attempts

### Layer 2: Frontend
- Page detects 403 and redirects
- Shows clear error message

### Layer 3: API
- All endpoints check authorization
- Returns 403 for unauthorized requests

### Layer 4: Database
- Uses service role key for queries
- Row-level security can be added if needed

## Testing

### Test as Admin:
1. Log in as admin user
2. See "Media Library" in menu ✅
3. Navigate to `/admin/media` ✅
4. Can upload, view, edit, delete media ✅

### Test as Manager:
1. Log in as manager user
2. See "Media Library" in menu ✅
3. Navigate to `/admin/media` ✅
4. Can upload, view, edit, delete media ✅

### Test as Support:
1. Log in as support user
2. "Media Library" NOT in menu ✅
3. Try to navigate to `/admin/media` directly
4. See "Access Denied" message ✅
5. Redirected to dashboard ✅

### Test as Sales:
1. Log in as sales user
2. "Media Library" NOT in menu ✅
3. Try to navigate to `/admin/media` directly
4. See "Access Denied" message ✅
5. Redirected to dashboard ✅

## API Error Responses

### 403 Forbidden (Unauthorized)

```json
{
  "error": "Unauthorized. Only admin and manager roles can upload media."
}
```

### 401 Unauthorized (Not Logged In)

If no session exists, `getUserRole()` returns `null` and `canAccessMedia()` returns `false`, resulting in 403.

## Database Schema

### admin_profiles Table

Required for role checking:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | User ID (from auth.users) |
| full_name | TEXT | User's full name |
| role | TEXT | One of: admin, manager, support, sales |
| is_active | BOOLEAN | Whether user is active |

## Helper Functions

### canAccessMedia()

**File:** `lib/auth/roles.ts` (Lines 94-98)

```typescript
export async function canAccessMedia(): Promise<boolean> {
  const role = await getUserRole();
  return role === "admin" || role === "manager";
}
```

Simple function to check if current user can access media features.

**Usage:**
```typescript
const hasAccess = await canAccessMedia();
if (!hasAccess) {
  // Handle unauthorized access
}
```

## Audit Trail

All media uploads include `uploaded_by` field with the uploader's name:

```sql
SELECT
  title,
  uploaded_by,
  created_at
FROM media_library
ORDER BY created_at DESC;
```

Example output:
```
title                 | uploaded_by    | created_at
---------------------|----------------|---------------------------
Bali Sunset          | John Smith     | 2025-12-14 10:30:00+00
Bangkok Temple       | Jane Manager   | 2025-12-14 09:15:00+00
```

## Consumer Site Access

The consumer-facing site (`wandering-lens`) has **NO authorization checks** on the media API endpoint (`/api/media`) because it only returns public media.

**File:** `wandering-lens/app/api/media/route.ts` (Line 12)

```typescript
.eq("is_public", true) // Only show public media
```

Anyone can view the gallery at `/gallery`, but only public media is displayed.

## Future Enhancements

- [ ] Add granular permissions (view-only manager)
- [ ] Add audit log table for media actions
- [ ] Add bulk permissions update
- [ ] Add media folder permissions
- [ ] Add IP whitelist for additional security
- [ ] Add rate limiting for uploads
- [ ] Add file type restrictions per role

## Summary

✅ **Admin & Manager**: Full access to media library
❌ **Support & Sales**: No access to media library
🔒 **Security**: Multi-layer protection (UI, frontend, API)
📝 **Audit**: Upload tracking with user names
🌐 **Public**: Consumer site shows only public media
