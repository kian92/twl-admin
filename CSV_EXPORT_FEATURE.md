# CSV Export Feature - Bookings Management

## Overview

Added CSV export functionality to the bookings management page, allowing admins to download all booking data for reporting, analysis, and record-keeping.

## Files Created/Modified

### 1. New API Endpoint: `app/api/bookings/export/route.ts`

**Functionality:**
- Fetches all bookings from the database
- Includes related booking items (experiences)
- Supports status filtering (confirmed, pending, cancelled, or all)
- Formats data as CSV with proper escaping
- Returns downloadable CSV file

**CSV Columns:**
1. Booking No
2. Booking Date
3. Customer Name
4. Customer Email
5. Customer Phone
6. Travel Date
7. Experiences (semicolon-separated if multiple)
8. Total Pax
9. Adults
10. Children
11. Infants
12. Payment Method
13. Payment Status
14. Booking Status
15. Total Cost
16. Deposit Amount
17. Balance Amount
18. Payment Reference
19. Special Requests
20. Created At (timestamp)

**Features:**
- ✅ Proper CSV escaping for fields with commas, quotes, or newlines
- ✅ Multiple experiences listed in one field (separated by semicolon)
- ✅ Passenger breakdown (adults, children, infants)
- ✅ Financial details (total, deposit, balance)
- ✅ Timestamps in ISO format
- ✅ Status filtering support

### 2. Updated: `app/admin/bookings/page.tsx`

**Changes:**
- Added `isExporting` state for loading indicator
- Added `handleExportCSV` function to trigger download
- Connected "Export CSV" button to export functionality
- Button shows "Exporting..." during download
- Button is disabled while exporting

**User Flow:**
1. Admin clicks "Export CSV" button
2. Button shows "Exporting..." and becomes disabled
3. API fetches all bookings (respecting current status filter)
4. CSV file is generated and automatically downloaded
5. Filename format: `bookings-export-YYYY-MM-DD.csv`
6. Button returns to normal state

## Usage

### Export All Bookings

1. Go to `/admin/bookings`
2. Click the "Export CSV" button in the top right
3. CSV file downloads automatically

### Export Filtered Bookings

1. Go to `/admin/bookings`
2. Select a status filter (e.g., "Confirmed")
3. Click "Export CSV"
4. Only bookings with that status will be exported

## CSV Output Example

```csv
Booking No,Booking Date,Customer Name,Customer Email,Customer Phone,Travel Date,Experiences,Total Pax,Adults,Children,Infants,Payment Method,Payment Status,Booking Status,Total Cost,Deposit Amount,Balance Amount,Payment Reference,Special Requests,Created At
BK-2025-0001,2025-12-14,John Doe,john@example.com,+1234567890,2025-12-30,Bali Adventure; Bangkok Tour,6,6,0,0,Stripe,paid,confirmed,1200,100,1100,pi_abc123,Vegetarian meals,2025-12-14T05:38:42.123Z
BK-2025-0002,2025-12-14,Jane Smith,jane@example.com,+1234567891,2025-12-25,Chiang Mai Elephant Sanctuary,3,2,1,0,Bank Transfer,paid,confirmed,450,0,0,,Early pickup,2025-12-14T05:31:15.456Z
```

## Technical Details

### CSV Escaping

The export properly handles special characters:
- Fields with commas are wrapped in quotes
- Quotes inside fields are escaped as double quotes (`""`)
- Newlines are preserved within quoted fields

**Example:**
```typescript
Input: Special request: "Please arrive early, before 8 AM"
Output CSV: "Special request: ""Please arrive early, before 8 AM"""
```

### Multiple Experiences

When a booking has multiple experiences:
- Listed in "Experiences" column
- Separated by semicolon and space ("; ")
- Example: `Bali Adventure; Bangkok Tour; Phuket Beach`

### Date Formats

- **Booking Date & Travel Date**: YYYY-MM-DD format (e.g., `2025-12-14`)
- **Created At**: ISO 8601 format with timezone (e.g., `2025-12-14T05:38:42.123Z`)

### Status Filter Integration

The export respects the current status filter:
- If filter is "confirmed" → exports only confirmed bookings
- If filter is "pending" → exports only pending bookings
- If filter is "all" (default) → exports all bookings

## Use Cases

### 1. Financial Reporting
- Export all paid bookings for accounting
- Track deposit vs balance payments
- Revenue analysis by date range

### 2. Operations Management
- Export confirmed bookings for supplier coordination
- Track passenger counts for capacity planning
- View upcoming travel dates

### 3. Customer Service
- Export customer contact information
- Review special requests
- Track payment references for support tickets

### 4. Data Analysis
- Import into Excel/Google Sheets for analysis
- Create pivot tables and reports
- Track booking trends over time

## Future Enhancements

Possible improvements for later:

- [ ] Add date range filter for exports
- [ ] Option to export only visible/filtered bookings (current page)
- [ ] Include booking items details in separate rows (one row per experience)
- [ ] Add Excel format export (.xlsx)
- [ ] Email export directly to admin
- [ ] Schedule automated exports (daily/weekly reports)
- [ ] Add more columns (experience prices, add-ons, etc.)
- [ ] Compress large exports as ZIP files

## Testing

### Test Scenarios

1. **Export All Bookings:**
   - Should include all statuses
   - Should have all columns populated

2. **Export with Filter:**
   - Filter by "confirmed"
   - Export should only contain confirmed bookings

3. **Multiple Experiences:**
   - Create booking with 2+ experiences
   - Export should list all in one field, semicolon-separated

4. **Special Characters:**
   - Booking with commas in notes
   - Should be properly escaped in CSV

5. **Empty Data:**
   - Bookings without phone or special requests
   - Should show empty fields, not "null" or "undefined"

## Notes

- Export is instantaneous for up to ~1000 bookings
- For very large datasets (10,000+ bookings), consider pagination or background processing
- CSV encoding is UTF-8 for international character support
- File size is approximately 1KB per booking record
