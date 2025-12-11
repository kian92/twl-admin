# Add-ons Feature - Quick Start Guide

## Overview
The add-ons feature allows admins to create optional extras (like single supplements, insurance, equipment) that customers can select when booking experiences.

## For Admins

### Creating Add-ons

1. Navigate to **Admin > Experiences > Edit Experience**
2. Scroll to **Packages & Pricing** section
3. Expand a package
4. Click **"Add Item"** in the **Add-ons & Optional Extras** section
5. Fill in:
   - **Add-on Name**: e.g., "Single Supplement"
   - **Category**: Transportation, Activities, Meals, Insurance, Equipment, Accommodation, Other
   - **Description**: Brief explanation
   - **Pricing Type**:
     - Per Person: Multiplied by number of travelers
     - Per Group: Flat rate regardless of group size
     - Per Unit: Price per item quantity
   - **Price**: Amount in USD
   - **Max Quantity**: Maximum units that can be selected
   - **Required**: Check if this should be mandatory
6. Click **Save**

### Example Add-ons

**Single Supplement**
- Pricing Type: Per Person
- Price: $150
- Description: "Private accommodation for solo travelers"

**Airport Transfer**
- Pricing Type: Per Group
- Price: $80
- Description: "Round-trip airport pickup and drop-off"

**Travel Insurance**
- Pricing Type: Per Person
- Price: $45
- Description: "Comprehensive travel coverage"

**Snorkeling Gear**
- Pricing Type: Per Unit
- Price: $15
- Max Quantity: 10
- Description: "Professional snorkeling equipment rental"

## For Developers

### Enabling Add-ons on Experience Pages

```typescript
// 1. Fetch experience with add-ons
const { experience, addons } = await fetchExperienceWithAddons(experienceId)

// 2. Pass to component
<ExperienceOverview
  experience={experience}
  addons={addons}
/>
```

### Fetching Add-ons

```typescript
const fetchExperienceWithAddons = async (experienceId: string) => {
  // Fetch packages for this experience
  const packagesRes = await fetch(`/api/admin/packages?experience_id=${experienceId}`)
  const packages = await packagesRes.json()

  // Get add-ons from active package
  const activePackage = packages.find((p: any) => p.is_active)
  const addons = activePackage?.addons || []

  return { experience, addons }
}
```

## For Customers

### Selecting Add-ons

1. Browse to an experience detail page
2. Select date and number of travelers
3. In **"Optional Add-ons"** section:
   - Check the checkbox to select an add-on
   - Use +/- buttons to adjust quantity (if available)
4. Watch the total price update automatically
5. Click **"Add to My Trip"**
6. View selected add-ons in checkout summary

## Price Calculation

### Per Person Example
- Add-on: Single Supplement at $50/person
- Group: 2 adults, 1 child
- Calculation: $50 × 3 = **$150**

### Per Group Example
- Add-on: Airport Transfer at $80/group
- Calculation: **$80** (same for any group size)

### Per Unit Example
- Add-on: Snorkeling Gear at $15/unit
- Quantity: 3
- Calculation: $15 × 3 = **$45**

## Features

### Admin Side ✅
- Create/edit/delete add-ons per package
- Set pricing type (per person/group/unit)
- Add descriptions and categories
- Set quantity limits
- Mark as required/optional

### Consumer Side ✅
- View available add-ons
- Select/deselect with checkbox
- Adjust quantities
- Real-time price updates
- See add-ons in cart and checkout
- Total price includes add-ons

## Files Modified

### Backend
- `app/api/admin/packages/route.ts` - Create add-ons
- `app/api/admin/packages/[id]/route.ts` - Update/delete add-ons
- `supabase/migrations/add_package_pricing_system.sql` - Database schema

### Frontend - Admin
- `components/admin/PackageFormSection.tsx` - Add-ons form UI

### Frontend - Consumer
- `components/trip-context.tsx` - Add-ons state management
- `components/experience/experience-overview.tsx` - Add-ons selection UI
- `components/checkout/checkout-summary.tsx` - Display in checkout

## Documentation
- [`ADDONS_FEATURE.md`](./ADDONS_FEATURE.md) - Admin side documentation
- [`CONSUMER_ADDONS_IMPLEMENTATION.md`](./CONSUMER_ADDONS_IMPLEMENTATION.md) - Consumer side documentation

## Support
For questions or issues, check the detailed documentation files above or contact the development team.
