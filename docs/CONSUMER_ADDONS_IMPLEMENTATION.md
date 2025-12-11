# Consumer-Side Add-ons Implementation

## Overview
This document describes the implementation of the add-ons feature for consumers on the booking/checkout flow. Consumers can now select optional add-ons when booking experiences, with real-time price calculations.

## Features Implemented

### 1. Trip Context Updates
**File:** [`components/trip-context.tsx`](../components/trip-context.tsx)

- Added `AddOnSelection` interface to track selected add-ons
- Updated `TripItem` interface to include `selectedAddons` array
- Modified `addToTrip` function to accept and calculate add-ons pricing
- Price calculation logic:
  - **Per Person**: `price × quantity × (adults + children)`
  - **Per Group**: `price × quantity`
  - **Per Unit**: `price × quantity`

### 2. Experience Overview Component
**File:** [`components/experience/experience-overview.tsx`](../components/experience/experience-overview.tsx)

#### New Props
- `addons?: PackageAddon[]` - Array of available add-ons for the experience

#### New State
- `selectedAddons: Record<string, number>` - Tracks quantity of each selected add-on

#### New UI Components
- **Add-ons Section** - Appears between "Number of People" and "Total Price"
- Checkbox to select/deselect add-ons
- Quantity controls (+/-) for add-ons with `max_quantity > 1`
- Display of:
  - Add-on name
  - Description
  - Price with pricing type label (per person/group/unit)
  - Category badge

#### Price Display Updates
- Shows breakdown: base price + add-ons
- Real-time calculation as add-ons are selected
- Color-coded add-ons price in primary color

### 3. Checkout Summary Component
**File:** [`components/checkout/checkout-summary.tsx`](../components/checkout/checkout-summary.tsx)

#### Updates
- Displays selected add-ons under each experience
- Shows add-on name and quantity (if > 1)
- Color-coded in primary color for easy identification
- Total price already includes add-ons from TripContext

## How It Works

### User Flow

1. **Browse Experience**
   - User navigates to experience detail page
   - Add-ons are fetched and passed to `ExperienceOverview` component

2. **Select Add-ons**
   - User checks checkboxes to select optional add-ons
   - For add-ons with `max_quantity > 1`, user can adjust quantity
   - Price updates in real-time as selections change

3. **Add to Trip**
   - User clicks "Add to My Trip"
   - Selected add-ons are converted to `AddOnSelection[]` format
   - Total price is calculated including all add-ons
   - Trip item is stored in localStorage with add-ons data

4. **Checkout**
   - Checkout summary displays all experiences with their add-ons
   - Total price reflects base price + add-ons
   - User completes booking with add-ons included

### Pricing Logic Example

```typescript
// Example: Single Supplement (per_person)
// 2 adults, 1 child, quantity: 1
// Price: $50 per person
// Total: $50 × 1 × (2 + 1) = $150

// Example: Airport Transfer (per_group)
// Price: $80 per group
// Quantity: 1
// Total: $80 × 1 = $80

// Example: Snorkeling Gear (per_unit)
// Price: $15 per unit
// Quantity: 3
// Total: $15 × 3 = $45
```

## Data Flow

```
1. Admin creates add-ons → Saved to database (package_addons table)
                                     ↓
2. Experience detail page loads → Fetch add-ons from API
                                     ↓
3. Pass add-ons to ExperienceOverview component
                                     ↓
4. User selects add-ons → Calculate prices in real-time
                                     ↓
5. User adds to trip → Store in TripContext with add-ons
                                     ↓
6. Checkout → Display add-ons in summary
                                     ↓
7. Complete booking → Submit with add-ons data
```

## Required Integration Steps

### For Experience Detail Pages

To enable add-ons on experience detail pages, you need to:

1. **Fetch add-ons from API**
```typescript
// In your experience detail page
const fetchExperienceWithAddons = async (experienceId: string) => {
  // Fetch experience data
  const experienceRes = await fetch(`/api/experiences/${experienceId}`)
  const experience = await experienceRes.json()

  // Fetch packages with add-ons
  const packagesRes = await fetch(`/api/admin/packages?experience_id=${experienceId}`)
  const packages = await packagesRes.json()

  // Get add-ons from the first active package (or selected package)
  const activePackage = packages.find((p: any) => p.is_active)
  const addons = activePackage?.addons || []

  return { experience, addons }
}
```

2. **Pass add-ons to ExperienceOverview**
```tsx
<ExperienceOverview
  experience={experience}
  addons={addons}
/>
```

## UI/UX Features

### Add-ons Display
- ✅ Checkbox for selection
- ✅ Add-on name and description
- ✅ Price with pricing type
- ✅ Quantity controls (+/-) when applicable
- ✅ Max quantity enforcement
- ✅ Scrollable list (max height 300px)
- ✅ Disabled state handling

### Price Display
- ✅ Real-time calculation
- ✅ Breakdown showing:
  - Base price (adults + children)
  - Add-ons subtotal
  - Grand total
- ✅ Color-coded add-ons price
- ✅ Detailed tooltip on hover

### Checkout Summary
- ✅ Add-ons listed under each experience
- ✅ Quantity indicator (×2, ×3, etc.)
- ✅ Color-coded for easy scanning
- ✅ Included in total price

## Testing Checklist

- [ ] Add-ons display correctly on experience page
- [ ] Selecting add-on updates price in real-time
- [ ] Quantity controls work correctly
- [ ] Max quantity is enforced
- [ ] Per-person pricing calculates correctly
- [ ] Per-group pricing calculates correctly
- [ ] Per-unit pricing calculates correctly
- [ ] Add-ons persist in trip cart
- [ ] Add-ons display in checkout summary
- [ ] Total price includes add-ons
- [ ] LocalStorage saves/loads add-ons correctly

## Future Enhancements

1. **Required Add-ons**
   - Auto-select required add-ons
   - Prevent deselection
   - Show "Required" badge

2. **Add-on Categories**
   - Group add-ons by category
   - Expandable sections
   - Category icons

3. **Add-on Images**
   - Display thumbnail images
   - Image gallery on click
   - Visual selection

4. **Conditional Add-ons**
   - Show/hide based on selections
   - Dynamic pricing rules
   - Bundle discounts

5. **Add-on Recommendations**
   - "Frequently bought together"
   - AI-powered suggestions
   - Popular add-ons badge

## Troubleshooting

### Add-ons not showing
- Verify add-ons exist in database for the package
- Check that package is active
- Ensure add-ons are fetched in API call
- Verify `addons` prop is passed to component

### Price calculation incorrect
- Check pricing_type is set correctly
- Verify max_quantity logic
- Ensure adults/children count is accurate
- Review TripContext calculation logic

### Add-ons not persisting
- Check localStorage permissions
- Verify TripContext serialization
- Ensure selectedAddons array is properly formatted

## Related Files

- [`components/trip-context.tsx`](../components/trip-context.tsx) - Context and state management
- [`components/experience/experience-overview.tsx`](../components/experience/experience-overview.tsx) - Add-ons selection UI
- [`components/checkout/checkout-summary.tsx`](../components/checkout/checkout-summary.tsx) - Checkout display
- [`docs/ADDONS_FEATURE.md`](./ADDONS_FEATURE.md) - Admin-side documentation
- [`types/pricing.ts`](../types/pricing.ts) - TypeScript interfaces
