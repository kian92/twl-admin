# Booking Data Debug Guide

## Issue Summary

After completing a checkout on the consumer site, two issues were reported:
1. **Pax count shows 1** instead of actual number of travelers
2. **Travel date shows "Invalid Date"** instead of the selected date

## What I've Done

### 1. Added Debug Logging Throughout the Flow

I've added comprehensive console logging at every step of the booking creation and display process:

#### A. Stripe Webhook (`app/api/webhooks/stripe/route.ts`)

**Lines 71-76**: Logs submission data received from database
```typescript
console.log("=== WEBHOOK DEBUG: Submission Data ===");
console.log("Travel Date:", submission.travel_date, "Type:", typeof submission.travel_date);
console.log("Travelers:", submission.travelers, "Type:", typeof submission.travelers);
console.log("Amount:", submission.amount);
```

**Lines 114-120**: Logs the created booking record
```typescript
console.log("=== WEBHOOK DEBUG: Created Booking ===");
console.log("Booking ID:", booking.id);
console.log("Booking No:", booking.booking_no);
console.log("Travel Date:", booking.travel_date, "Type:", typeof booking.travel_date);
console.log("Number of Adults:", booking.number_of_adults);
```

**Lines 144-148**: Logs booking item creation
```typescript
console.log("=== WEBHOOK DEBUG: Booking Item ===");
console.log("Pax Count:", bookingItemData.pax_count);
console.log("Quantity:", bookingItemData.quantity);
```

#### B. Booking Details API (`app/api/bookings/[id]/details/route.ts`)

**Lines 30-34**: Logs booking data retrieved from database
```typescript
console.log("=== API DEBUG: Booking from DB ===");
console.log("Travel Date:", booking.travel_date, "Type:", typeof booking.travel_date);
console.log("Number of Adults:", booking.number_of_adults);
```

**Lines 87-91**: Logs booking item data
```typescript
console.log("=== API DEBUG: Booking Item ===");
console.log("Pax Count:", item.pax_count, "Type:", typeof item.pax_count);
console.log("Quantity:", item.quantity);
```

#### C. Booking Details Page (`app/admin/bookings/[id]/page.tsx`)

**Lines 91-96**: Logs data received in the frontend
```typescript
console.log("=== BOOKING DETAILS DEBUG ===");
console.log("Travel Date:", data.booking.travel_date, "Type:", typeof data.booking.travel_date);
console.log("Number of Adults:", data.booking.number_of_adults);
console.log("Booking Items:", data.booking.booking_items);
```

### 2. Improved Date Formatting Function

**Lines 188-207**: Enhanced the `formatDate` function with better error handling
```typescript
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.error("Invalid date:", dateString);
      return "Invalid Date";
    }
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid Date";
  }
};
```

## How to Debug

### Step 1: Complete a Test Checkout

1. Go to `/pay/[your-link-code]` on the admin site
2. Fill out the checkout form:
   - Enter your details
   - **Select a travel date**
   - **Select 2 or more travelers**
   - Complete the payment with Stripe test card: `4242 4242 4242 4242`

### Step 2: Monitor Server Logs

Watch your server console logs for the debug output. You should see logs appearing in this order:

1. **When Stripe webhook is triggered:**
   ```
   === WEBHOOK DEBUG: Submission Data ===
   Travel Date: [value] Type: [type]
   Travelers: [value] Type: [type]
   Amount: [value]
   ====================================

   === WEBHOOK DEBUG: Created Booking ===
   Booking ID: [uuid]
   Booking No: BK-2025-XXXX
   Travel Date: [value] Type: [type]
   Number of Adults: [value]
   ======================================

   === WEBHOOK DEBUG: Booking Item ===
   Pax Count: [value]
   Quantity: [value]
   ===================================
   ```

2. **When you view the booking details page:**
   ```
   === API DEBUG: Booking from DB ===
   Travel Date: [value] Type: [type]
   Number of Adults: [value]
   ================================

   === API DEBUG: Booking Item ===
   Pax Count: [value] Type: [type]
   Quantity: [value]
   ==============================
   ```

3. **In browser console (F12 → Console tab):**
   ```
   === BOOKING DETAILS DEBUG ===
   Travel Date: [value] Type: [type]
   Number of Adults: [value]
   Booking Items: [array]
   ============================
   ```

### Step 3: Analyze the Logs

Check each stage and identify where the data becomes incorrect:

#### If travel_date is null/undefined in webhook logs:
- **Problem**: Data not being stored in `payment_submissions` table
- **Check**: The checkout session creation API at `app/api/payment-links/create-checkout-session/route.ts` line 84
- **Verify**: Is the form sending `travelDate` correctly?

#### If travel_date is correct in webhook but wrong in API logs:
- **Problem**: Issue with database storage or retrieval
- **Check**: Database migration was run correctly
- **Verify**: Run this SQL query:
  ```sql
  SELECT id, booking_no, travel_date, number_of_adults
  FROM bookings
  ORDER BY created_at DESC
  LIMIT 5;
  ```

#### If travel_date is correct in API but shows "Invalid Date" in browser:
- **Problem**: Date formatting issue in frontend
- **Check**: Browser console error messages
- **Verify**: The formatDate function is receiving the correct data type

#### If pax_count is 1 in webhook logs:
- **Problem**: The travelers value is not being read from submission
- **Check**: Line 92 and 116 in webhook route - verify `submission.travelers` has the correct value

#### If pax_count is correct in webhook but 1 in API logs:
- **Problem**: Database storage issue with `booking_items` table
- **Verify**: Run this SQL query:
  ```sql
  SELECT booking_id, experience_title, quantity, pax_count
  FROM booking_items
  WHERE booking_id = '[your-booking-id]';
  ```

## Common Issues and Solutions

### Issue 1: Date is stored as DATE type but appears as string

**Solution**: JavaScript's `new Date()` can handle ISO date strings like "2025-12-14" correctly. The improved formatDate function now validates this.

### Issue 2: pax_count column doesn't exist

**Symptom**: API logs show `pax_count: undefined`

**Solution**: Run the database migration:
```sql
ALTER TABLE public.booking_items
ADD COLUMN IF NOT EXISTS pax_count INTEGER DEFAULT 1;
```

### Issue 3: Old bookings showing incorrect data

**Explanation**: Bookings created before the webhook fix won't have proper pax_count or travel_date. This is expected.

**Solution**: Only test with NEW bookings created after the webhook changes.

## Data Flow Summary

```
1. User fills form on /pay/[linkCode]
   ↓
2. Form submits to /api/payment-links/create-checkout-session
   ↓
3. Creates record in payment_submissions table
   travel_date: "2025-12-14" (string from input type="date")
   travelers: 2 (number)
   ↓
4. Creates Stripe checkout session
   ↓
5. User pays on Stripe
   ↓
6. Stripe webhook hits /api/webhooks/stripe
   ↓
7. Webhook fetches submission from payment_submissions
   ↓
8. Webhook creates booking record:
   travel_date: submission.travel_date
   number_of_adults: submission.travelers
   ↓
9. Webhook creates booking_items record:
   pax_count: submission.travelers
   quantity: submission.travelers
   ↓
10. Admin views booking at /admin/bookings/[id]
    ↓
11. API fetches booking and booking_items
    ↓
12. Frontend displays with formatDate()
```

## Expected Values

For a booking with:
- **Travel date selected**: December 25, 2025
- **Travelers**: 2 people

### In payment_submissions table:
```sql
travel_date: '2025-12-25'
travelers: 2
```

### In bookings table:
```sql
travel_date: '2025-12-25'
number_of_adults: 2
number_of_children: 0
number_of_infants: 0
```

### In booking_items table:
```sql
quantity: 2
pax_count: 2
```

### In browser:
```
Travel Date: December 25, 2025
Total Passengers: 2 pax
Pricing Table: Pax: 2
```

## Next Steps

1. **Run a test checkout** with the debug logging in place
2. **Capture all console logs** from server and browser
3. **Compare the logs** against the expected flow above
4. **Identify where data diverges** from expectations
5. **Report findings** with the specific log output

## Files Modified

1. `app/api/webhooks/stripe/route.ts` - Added debug logging
2. `app/api/bookings/[id]/details/route.ts` - Added debug logging
3. `app/admin/bookings/[id]/page.tsx` - Added debug logging and improved formatDate
