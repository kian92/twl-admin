# Blocked Dates Feature Documentation

## Overview
The Blocked Dates feature allows staff to mark specific dates or date ranges as unavailable for tour packages. This prevents customers from booking tours on dates when they cannot be operated (e.g., holidays, maintenance, weather conditions, staff unavailability).

## Features

### ✅ Package-Level Blocking
- Block dates for specific tour packages
- More granular control than experience-level blocking
- Different packages within the same experience can have different availability

### ✅ Date Range Support
- Block single dates or date ranges
- Efficient management of consecutive unavailable dates
- Example: Block Dec 24-26 for Christmas holidays

### ✅ Reason Tracking
- Predefined reasons: Holiday, Maintenance, Weather, Staff Unavailable, Venue Closed, Special Event, Other
- Helps staff understand why dates are blocked
- Displayed when users attempt to book blocked dates

### ✅ Internal Notes
- Add additional context or instructions
- Internal-only information not shown to customers
- Useful for coordination between staff members

### ✅ Audit Trail
- Track who created each blocked date
- Timestamp when blocks were created
- Full history of blocked date changes

### ✅ Automatic Validation
- Prevents overlapping blocked date ranges
- Validates date ranges (start ≤ end)
- Real-time validation during booking

### ✅ Non-Destructive
- Existing bookings are preserved
- Only prevents new bookings on blocked dates
- Staff must manually handle existing bookings if needed

## Database Schema

### Table: `package_blocked_dates`

```sql
CREATE TABLE package_blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id UUID NOT NULL REFERENCES experience_packages(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_date_range CHECK (start_date <= end_date)
);
```

### Indexes
- `idx_blocked_dates_package_id` - Fast lookups by package
- `idx_blocked_dates_date_range` - Efficient date range queries
- `idx_blocked_dates_created_by` - Filter by creator

### Helper Functions
- `is_date_blocked(package_id, date)` - Check if a specific date is blocked
- `get_blocked_dates(package_id, start_date, end_date)` - Get all blocked dates in a range

## API Endpoints

### 1. Get Blocked Dates
```
GET /api/admin/blocked-dates?package_id={uuid}
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "package_id": "uuid",
      "start_date": "2025-12-24",
      "end_date": "2025-12-26",
      "reason": "Holiday",
      "notes": "Christmas holiday closure",
      "created_at": "2025-12-23T10:00:00Z",
      "created_by": "uuid",
      "auth_users": {
        "email": "staff@example.com",
        "full_name": "Staff Name"
      }
    }
  ]
}
```

### 2. Create Blocked Date
```
POST /api/admin/blocked-dates
Content-Type: application/json

{
  "package_id": "uuid",
  "start_date": "2025-12-24",
  "end_date": "2025-12-26",
  "reason": "Holiday",
  "notes": "Christmas holiday closure"
}
```

**Validation:**
- Checks for overlapping blocked dates
- Validates date range
- Requires authentication (admin/manager/supplier roles)

**Error Response (Overlap):**
```json
{
  "error": "Date range overlaps with existing blocked dates",
  "overlapping": [
    {
      "id": "uuid",
      "start_date": "2025-12-25",
      "end_date": "2025-12-27",
      "reason": "Maintenance"
    }
  ]
}
```

### 3. Update Blocked Date
```
PUT /api/admin/blocked-dates/{id}
Content-Type: application/json

{
  "start_date": "2025-12-24",
  "end_date": "2025-12-27",
  "reason": "Holiday",
  "notes": "Extended holiday closure"
}
```

### 4. Delete Blocked Date
```
DELETE /api/admin/blocked-dates/{id}
```

### 5. Get Package Availability
```
GET /api/packages/{id}/availability?start_date=2025-12-01&end_date=2025-12-31
```

**Response:**
```json
{
  "package_id": "uuid",
  "start_date": "2025-12-01",
  "end_date": "2025-12-31",
  "blocked_dates": [
    "2025-12-24",
    "2025-12-25",
    "2025-12-26"
  ],
  "blocked_ranges": [
    {
      "id": "uuid",
      "start_date": "2025-12-24",
      "end_date": "2025-12-26",
      "reason": "Holiday"
    }
  ]
}
```

## User Interface

### Admin Package Management
The BlockedDatesManager component is integrated into the package form section at:
- **Location:** `/admin/experiences/[slug]/[id]` (Edit Experience page)
- **Section:** Appears after the Add-ons section within each package
- **Visibility:** Only shown for saved packages (packages with an ID)

### Component Features
1. **Add Blocked Date Form**
   - Date range picker (start & end dates)
   - Reason dropdown with predefined options
   - Internal notes textarea
   - Real-time validation

2. **Blocked Dates List**
   - Visual date range display
   - Color-coded reason badges
   - Edit and delete buttons
   - Creator and timestamp information

3. **Error Handling**
   - Clear error messages for overlapping dates
   - Validation feedback
   - Confirmation dialogs for deletions

## Booking Flow Integration

### Pricing Calculation API
The pricing calculation endpoint now validates travel dates against blocked dates:

**File:** `/app/api/pricing/calculate/route.ts`

When a customer attempts to calculate pricing:
1. System checks if `travel_date` falls within any blocked date range
2. If blocked, returns error with reason:
   ```json
   {
     "error": "This date is not available for booking",
     "reason": "Holiday",
     "blocked": true
   }
   ```
3. Booking cannot proceed

### Client-Side Validation
Use the `checkBlockedDate()` function from pricing-calculator:

```typescript
import { checkBlockedDate } from '@/lib/utils/pricing-calculator';

const result = await checkBlockedDate(packageId, travelDate);

if (result.blocked) {
  alert(`This date is not available. Reason: ${result.reason}`);
  // Disable booking button or show error message
}
```

## Security & Permissions

### Row Level Security (RLS)
- **View:** All authenticated users can view blocked dates
- **Manage:** Only admin, manager, and supplier roles can create/update/delete
- **Audit:** Creator information tracked automatically

### Data Validation
- Server-side validation for all inputs
- Date range validation (start ≤ end)
- Overlap detection prevents conflicts
- SQL constraints ensure data integrity

## Usage Examples

### Example 1: Block Christmas Holidays
```javascript
// Block Dec 24-26 for all bookings
POST /api/admin/blocked-dates
{
  "package_id": "abc-123",
  "start_date": "2025-12-24",
  "end_date": "2025-12-26",
  "reason": "Holiday",
  "notes": "Office closed for Christmas"
}
```

### Example 2: Check Date Availability in Calendar
```javascript
// Fetch blocked dates for December
GET /api/packages/abc-123/availability?start_date=2025-12-01&end_date=2025-12-31

// Use response to disable dates in calendar picker
const disabledDates = response.blocked_dates; // ["2025-12-24", "2025-12-25", ...]
```

### Example 3: Staff Maintenance Block
```javascript
POST /api/admin/blocked-dates
{
  "package_id": "abc-123",
  "start_date": "2025-03-15",
  "end_date": "2025-03-15",
  "reason": "Maintenance",
  "notes": "Vehicle maintenance - no tours available"
}
```

## Migration Instructions

### Step 1: Apply Database Migration
Execute the SQL migration file in Supabase SQL Editor:

**File:** `/supabase/migrations/20251223_add_package_blocked_dates.sql`

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the entire migration SQL
4. Click "Run" to execute

### Step 2: Verify Migration
```sql
-- Check if table exists
SELECT * FROM package_blocked_dates LIMIT 1;

-- Check if functions exist
SELECT is_date_blocked('package-id', '2025-12-25');
```

### Step 3: Test the Feature
1. Navigate to any experience edit page
2. Expand a package section
3. Look for the "Blocked Dates" card
4. Try adding a blocked date
5. Attempt to book on a blocked date (should fail)

## Technical Architecture

### Files Created/Modified

**Database:**
- `/supabase/migrations/20251223_add_package_blocked_dates.sql` - Migration

**API Routes:**
- `/app/api/admin/blocked-dates/route.ts` - GET & POST
- `/app/api/admin/blocked-dates/[id]/route.ts` - PUT & DELETE
- `/app/api/packages/[id]/availability/route.ts` - GET availability
- `/app/api/pricing/calculate/route.ts` - Modified (validation added)

**Components:**
- `/components/admin/BlockedDatesManager.tsx` - New component
- `/components/admin/PackageFormSection.tsx` - Modified (integration)

**Utilities:**
- `/lib/utils/pricing-calculator.ts` - Added `checkBlockedDate()` function

## Future Enhancements

### Possible Additions:
1. **Bulk Import** - Upload CSV of blocked dates
2. **Recurring Blocks** - Block same day every week/month
3. **Alternative Suggestions** - Suggest nearby available dates
4. **Calendar View** - Visual calendar showing blocked dates
5. **Email Notifications** - Alert staff when dates are blocked
6. **Experience-Level Blocking** - Block entire experiences (not just packages)
7. **Customer Communication** - Auto-notify customers with bookings on newly blocked dates

## Support & Troubleshooting

### Common Issues

**Issue:** Blocked dates not appearing
- **Solution:** Verify package has an ID (must be saved)
- Check browser console for API errors

**Issue:** Cannot create blocked date (overlap error)
- **Solution:** Check existing blocked dates for the package
- Adjust date range to avoid overlap or delete conflicting block

**Issue:** Booking still allowed on blocked date
- **Solution:** Clear browser cache
- Verify migration was applied successfully
- Check API response includes `blocked: true`

**Issue:** Permission denied
- **Solution:** Verify user role (must be admin/manager/supplier)
- Check RLS policies in Supabase

## Best Practices

1. **Be Specific with Reasons** - Use appropriate reason codes for clarity
2. **Add Notes** - Include context for other staff members
3. **Review Existing Bookings** - Check for bookings before blocking dates
4. **Communicate Changes** - Inform team when blocking dates
5. **Regular Cleanup** - Remove past blocked dates periodically
6. **Test Before Blocking** - Verify date range is correct before saving

## Contact

For questions or issues with the Blocked Dates feature:
- Check this documentation first
- Review error messages carefully
- Contact technical support with specific error details
