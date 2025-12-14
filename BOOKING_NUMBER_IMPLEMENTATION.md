# Booking Number Implementation

## Overview

Added a human-readable `booking_no` field to bookings that displays friendly booking numbers like **BK-2025-0001** instead of UUIDs.

---

## Changes Made ✅

### 1. Database Migration Created
**File:** `supabase/migrations/20251214_add_booking_number.sql`

**Features:**
- ✅ Adds `booking_no` TEXT column to bookings table
- ✅ Creates auto-increment sequence for booking numbers
- ✅ Generates numbers in format: **BK-YYYY-NNNN** (e.g., BK-2025-0001)
- ✅ Auto-generates booking_no on insert via trigger
- ✅ Backfills existing bookings with numbers (ordered by created_at)
- ✅ Creates unique constraint and index for fast lookups
- ✅ Numbers reset annually (new year = new sequence)

### 2. Database Types Updated
**File:** `types/database.ts`

Added `booking_no: string | null` to:
- `bookings.Row`
- `bookings.Insert`
- `bookings.Update`

### 3. Bookings List Page Updated
**File:** `app/admin/bookings/page.tsx`

**Changes:**
- ❌ Removed: "Booking ID" column showing UUID
- ✅ Added: "Booking No." column showing friendly number
- ✅ Displays: BK-2025-0001 (or fallback to shortened UUID)
- ✅ Font: Monospaced for better readability
- ✅ Styling: Semibold to make it stand out

### 4. Booking Details Page Updated
**File:** `app/admin/bookings/[id]/page.tsx`

**Changes:**
- ✅ Header now shows booking_no instead of full UUID
- ✅ Falls back to UUID if booking_no doesn't exist (old bookings)
- ✅ Monospaced font for consistency

---

## Booking Number Format

### Format: `BK-YYYY-NNNN`

| Part | Description | Example |
|------|-------------|---------|
| **BK** | Prefix (Booking) | BK |
| **YYYY** | Current Year | 2025 |
| **NNNN** | Sequential Number (padded to 4 digits) | 0001, 0002, ... 9999 |

### Examples:
- First booking of 2025: **BK-2025-0001**
- 42nd booking of 2025: **BK-2025-0042**
- 1000th booking of 2025: **BK-2025-1000**
- First booking of 2026: **BK-2026-0001** (resets)

---

## How It Works

### Auto-Generation
1. When a new booking is created
2. Trigger fires **before insert**
3. Function generates next number in sequence
4. Booking_no is set automatically
5. No manual intervention needed!

### Sequence Logic
```sql
-- Get current year
current_year := EXTRACT(YEAR FROM CURRENT_DATE);

-- Get next number
next_num := nextval('booking_number_seq');

-- Format: BK-2025-0001
booking_num := 'BK-' || current_year || '-' || LPAD(next_num, 4, '0');
```

### Uniqueness
- Unique constraint ensures no duplicates
- Index provides fast lookups
- UUID (`id`) remains primary key

---

## Setup Instructions

### Step 1: Run the Migration

**Option A - Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/20251214_add_booking_number.sql`
3. Paste and run
4. Check for "Success" message

**Option B - Supabase CLI:**
```bash
npx supabase db push
```

### Step 2: Verify Setup

**Check if migration worked:**
```sql
-- Check column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'booking_no';

-- Check if backfill worked
SELECT booking_no, customer_name, created_at
FROM bookings
ORDER BY created_at ASC
LIMIT 10;
```

**Expected Results:**
- ✅ Column `booking_no` exists
- ✅ All existing bookings have booking numbers
- ✅ Numbers are sequential and unique

### Step 3: Test New Bookings

1. Create a test booking (via payment link or admin)
2. Check bookings list at `/admin/bookings`
3. Verify booking_no shows (e.g., BK-2025-0123)
4. Click "View Details"
5. Verify booking_no appears in header

---

## Display Locations

### 1. Bookings List Page (`/admin/bookings`)
- **Column header:** "Booking No."
- **Display:** BK-2025-0001
- **Fallback:** #12345678 (if booking_no is null)
- **Style:** Monospaced, semibold

### 2. Booking Details Page (`/admin/bookings/[id]`)
- **Location:** Header subtitle under "Booking Details"
- **Display:** BK-2025-0001
- **Fallback:** ID: [full-uuid]
- **Style:** Monospaced, muted text

### 3. Search Functionality
Users can search bookings by:
- ✅ Booking number (BK-2025-0001)
- ✅ Customer name
- ✅ Customer email

---

## Backwards Compatibility

### Old Bookings (Before Migration)
- ✅ **Will be backfilled** with booking numbers automatically
- ✅ Numbers assigned in order of `created_at` timestamp
- ✅ Oldest booking gets first number

### Fallback Display
If `booking_no` is somehow null:
- **List view:** Shows `#12345678` (first 8 chars of UUID)
- **Detail view:** Shows `ID: full-uuid-here`

---

## Future Enhancements

Possible improvements:

### Custom Prefix by Type
```
BK-2025-0001  (Regular booking)
GR-2025-0001  (Group booking)
CR-2025-0001  (Corporate booking)
```

### Branch/Location Codes
```
BK-SG-2025-0001  (Singapore)
BK-MY-2025-0001  (Malaysia)
```

### Reset Options
- Daily reset: BK-20251214-001
- Monthly reset: BK-202512-0001
- No reset: BK-000001 (continuous)

---

## API Updates Needed

### Stripe Webhook
The webhook now needs to be aware of booking_no. Since it's auto-generated by the database trigger, no changes needed! The booking_no will be created automatically.

### Search API
To enable search by booking_no:
```typescript
const matchesSearch =
  booking.booking_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  booking.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
```

This is **already implemented** in the bookings list page!

---

## Troubleshooting

### Issue: booking_no is null for new bookings
**Cause:** Trigger not working or sequence not created
**Fix:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'trigger_set_booking_number';

-- Check if sequence exists
SELECT * FROM pg_sequences WHERE sequencename = 'booking_number_seq';

-- Re-run migration if missing
```

### Issue: Duplicate booking numbers
**Cause:** Unique constraint failed or sequence out of sync
**Fix:**
```sql
-- Check for duplicates
SELECT booking_no, COUNT(*)
FROM bookings
GROUP BY booking_no
HAVING COUNT(*) > 1;

-- Reset sequence to max number
SELECT setval('booking_number_seq',
  (SELECT MAX(CAST(SPLIT_PART(booking_no, '-', 3) AS INTEGER))
   FROM bookings WHERE booking_no LIKE 'BK-2025-%'));
```

### Issue: booking_no doesn't show in UI
**Cause:** TypeScript types not updated or cache issue
**Fix:**
1. Verify types are updated in `types/database.ts`
2. Restart Next.js dev server
3. Clear browser cache (Cmd+Shift+R / Ctrl+Shift+F5)

---

## Summary

**Before:**
- Booking ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890` 😵
- Hard to read, share, or reference
- No human-friendly identifier

**After:**
- Booking No.: **BK-2025-0001** ✨
- Easy to read and share
- Professional appearance
- Auto-generated, no extra work!

The system now has a clean, professional booking number system that's perfect for customer communication and internal tracking!
