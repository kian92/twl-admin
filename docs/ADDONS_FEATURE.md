# Add-ons Feature Documentation

## Overview
The add-ons feature allows admins to create optional extra items for each package that consumers can choose during booking. Examples include single supplements, travel insurance, equipment rentals, airport transfers, etc.

## Features

### Admin Side
- **Create Add-ons**: Admins can add multiple add-ons to any package
- **Configure Details**:
  - Name (e.g., "Single Supplement", "Travel Insurance")
  - Description
  - Category (Transportation, Activities, Meals, Insurance, Equipment, Accommodation, Other)
  - Pricing Type:
    - Per Person (charged per traveler)
    - Per Group (flat rate for the entire group)
    - Per Unit (charged per item/quantity)
  - Price in USD
  - Max Quantity (how many units can be selected)
  - Required/Optional toggle (can be mandatory or optional)

### Database Schema
The add-ons are stored in the `package_addons` table with the following structure:
- `id`: UUID primary key
- `package_id`: Reference to the package
- `addon_name`: Name of the add-on
- `addon_code`: Optional code (e.g., "TRANSFER")
- `description`: Detailed description
- `pricing_type`: per_person, per_group, or per_unit
- `price`: Price in USD
- `currency`: Currency (default: USD)
- `min_quantity`: Minimum quantity (default: 1)
- `max_quantity`: Maximum quantity allowed
- `is_required`: Whether this is mandatory
- `category`: Category for grouping
- `display_order`: Order for display
- `is_active`: Active status

## User Interface

### Package Form Section
Located in `components/admin/PackageFormSection.tsx`, the UI includes:

1. **Add-ons Section**: Appears at the bottom of each package form
2. **Add Item Button**: Creates a new add-on entry
3. **Add-on Form Fields**:
   - Add-on Name (required)
   - Category (dropdown)
   - Description (textarea)
   - Pricing Type (dropdown)
   - Price (number input)
   - Max Quantity (number input)
   - Required checkbox

### Example Use Cases

1. **Single Supplement**
   - Name: "Single Supplement"
   - Category: Accommodation
   - Pricing Type: Per Person
   - Price: $150
   - Description: "Additional charge for solo travelers requiring private accommodation"
   - Required: No
   - Max Quantity: 1

2. **Airport Transfer**
   - Name: "Private Airport Transfer"
   - Category: Transportation
   - Pricing Type: Per Group
   - Price: $80
   - Description: "Round-trip airport pickup and drop-off"
   - Required: No
   - Max Quantity: 1

3. **Travel Insurance**
   - Name: "Comprehensive Travel Insurance"
   - Category: Insurance
   - Pricing Type: Per Person
   - Price: $45
   - Description: "Full coverage travel insurance for peace of mind"
   - Required: No
   - Max Quantity: 1

4. **Equipment Rental**
   - Name: "Snorkeling Equipment"
   - Category: Equipment
   - Pricing Type: Per Unit
   - Price: $15
   - Description: "Professional snorkeling gear including mask, snorkel, and fins"
   - Required: No
   - Max Quantity: 10

## API Integration

### Creating a Package with Add-ons
```typescript
POST /api/admin/packages
{
  experience_id: "uuid",
  package_name: "Premium Package",
  // ... other package fields
  addons: [
    {
      name: "Single Supplement",
      description: "Private accommodation",
      pricing_type: "per_person",
      price: 150,
      max_quantity: 1,
      is_required: false,
      category: "Accommodation"
    }
  ]
}
```

### Updating a Package with Add-ons
```typescript
PUT /api/admin/packages/{id}
{
  // ... package fields
  addons: [/* updated add-ons array */]
}
```

### Retrieving Packages with Add-ons
```typescript
GET /api/admin/packages?experience_id={id}
// Returns packages with nested addons array
```

## Implementation Files

### Frontend Components
- `components/admin/PackageFormSection.tsx` - Main UI component with add-ons form

### API Routes
- `app/api/admin/packages/route.ts` - POST endpoint (create package with add-ons)
- `app/api/admin/packages/[id]/route.ts` - PUT/DELETE endpoints (update/delete)

### Admin Pages
- `app/admin/experiences/new/page.tsx` - Create new experience with packages and add-ons
- `app/admin/experiences/[slug]/[id]/page.tsx` - Edit experience with packages and add-ons

### Type Definitions
- `components/admin/PackageFormSection.tsx` - `AddOnItem` interface
- `types/pricing.ts` - `PackageAddon` interface

## Consumer Side (Future Enhancement)
While the admin UI is now complete, the consumer-facing booking flow will need to be enhanced to:
1. Display available add-ons for each package
2. Allow customers to select optional add-ons
3. Update pricing calculations to include selected add-ons
4. Store selected add-ons in bookings

## Notes
- All add-ons are optional by default unless marked as required
- The pricing calculator will need to be updated to include add-ons in total price calculations
- Add-ons are package-specific, not experience-wide
- When a package is deleted, all associated add-ons are automatically deleted (CASCADE)
