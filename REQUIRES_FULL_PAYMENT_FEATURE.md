# Requires Full Payment Feature - Implementation Summary

## Overview
Added a new checkbox field to packages that indicates whether an experience/tour requires full payment upfront instead of a deposit.

## Changes Made

### 1. Database Schema
**File:** `supabase/migrations/20251226_add_requires_full_payment.sql`
- Added `requires_full_payment` boolean column to `experience_packages` table
- Default value: `false`
- Not null constraint applied

**To apply this migration:**
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of the migration file
4. Execute the SQL query

### 2. TypeScript Types
**File:** `components/admin/PackageFormSection.tsx`
- Added `requires_full_payment?: boolean` to `PackageFormData` interface
- Default value set to `false` when creating new packages

### 3. User Interface
**File:** `components/admin/PackageFormSection.tsx` (line ~408-424)
- Added a checkbox with label in the package form
- Positioned after the "Tour Type" selection
- Visual styling: bordered box with light background for emphasis
- Checkbox state managed through `updatePackage` function

### 4. API Routes

#### POST Route
**File:** `app/api/admin/packages/route.ts` (line 66)
- Added `requires_full_payment` field to package creation
- Defaults to `false` if not provided

#### PUT Route
**File:** `app/api/admin/packages/[id]/route.ts` (line 65)
- Added `requires_full_payment` field to package updates
- Defaults to `false` if not provided

### 5. Experience Pages

#### New Experience Page
**File:** `app/admin/experiences/new/page.tsx` (line 287)
- Includes `requires_full_payment` field in package payload when creating new experiences

#### Edit Experience Page
**File:** `app/admin/experiences/[slug]/[id]/page.tsx`
- Line 194: Loads `requires_full_payment` value from database
- Line 552: Includes field in package payload when updating experiences

### 6. Translations

#### English
**File:** `messages/en.json` (lines 143-144)
```json
"requiresFullPayment": "Requires Full Payment",
"requiresFullPaymentDesc": "Check this if customers must pay the full amount upfront instead of just a deposit"
```

#### Chinese
**File:** `messages/zh.json` (lines 143-144)
```json
"requiresFullPayment": "需要全额付款",
"requiresFullPaymentDesc": "如果客户必须预先支付全额而不仅仅是押金，请勾选此项"
```

## How to Use

1. **Apply the Database Migration:**
   - Navigate to Supabase Dashboard → SQL Editor
   - Run the migration script: `supabase/migrations/20251226_add_requires_full_payment.sql`

2. **Using the Feature:**
   - Go to Admin Portal → Experiences
   - Create a new experience or edit an existing one
   - In the "Packages & Pricing" section, expand any package
   - You'll see a checkbox labeled "Requires Full Payment" below the "Tour Type" field
   - Check the box if the package requires full payment upfront

3. **Reading the Value:**
   - The `requires_full_payment` field is now stored in the `experience_packages` table
   - Access it via the packages API: `/api/admin/packages?experience_id={id}`
   - Use this field in your booking/payment flows to determine payment requirements

## Next Steps (Optional)

To fully implement this feature in the booking flow, you may want to:

1. Update booking/checkout pages to read this field
2. Modify payment logic to enforce full payment when `requires_full_payment` is true
3. Display payment requirements clearly to customers during booking
4. Update confirmation emails to reflect full payment requirement

## Testing

1. Create a new experience with a package
2. Check the "Requires Full Payment" checkbox
3. Save the experience
4. Edit the experience and verify the checkbox is checked
5. Query the database to confirm the field is saved correctly

## Files Modified

1. `supabase/migrations/20251226_add_requires_full_payment.sql` (new)
2. `components/admin/PackageFormSection.tsx`
3. `app/api/admin/packages/route.ts`
4. `app/api/admin/packages/[id]/route.ts`
5. `app/admin/experiences/new/page.tsx`
6. `app/admin/experiences/[slug]/[id]/page.tsx`
7. `messages/en.json`
8. `messages/zh.json`
