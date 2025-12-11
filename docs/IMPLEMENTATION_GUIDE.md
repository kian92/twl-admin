# Pricing System Implementation Guide

## Quick Start

This guide will help you integrate the professional pricing system into your travel agency admin interface.

---

## Step 1: Apply Database Migration

Run the migration to create all pricing tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually execute
psql -f supabase/migrations/add_package_pricing_system.sql
```

This will:
- Create 8 new tables for the pricing system
- Automatically migrate existing experiences to "Standard Package"
- Set up indexes for optimal performance
- Create a helper function for price calculation

---

## Step 2: Update Your Admin Forms

### Option A: Enhanced Experience Form (Recommended for existing flow)

Add package management section to your experience form:

```typescript
// In: app/admin/experiences/new/page.tsx or [id]/page.tsx

import { PackageFormData } from '@/types/pricing';

// Add to your form state
const [packages, setPackages] = useState<PackageFormData[]>([
  {
    package_name: 'Standard Package',
    package_code: 'STD',
    description: 'Our standard package with essential inclusions',
    min_group_size: 1,
    max_group_size: 15,
    inclusions: [],
    exclusions: [],
    display_order: 0,
    adult_price: 0,
    child_price: 0,
  }
]);

// Add package section to your form
<Card>
  <CardHeader>
    <CardTitle>Packages & Pricing</CardTitle>
  </CardHeader>
  <CardContent>
    {packages.map((pkg, index) => (
      <div key={index} className="space-y-4 border-b pb-4">
        <Input
          label="Package Name"
          value={pkg.package_name}
          onChange={(e) => updatePackage(index, 'package_name', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Adult Price (USD)"
            type="number"
            value={pkg.adult_price}
            onChange={(e) => updatePackage(index, 'adult_price', Number(e.target.value))}
          />
          <Input
            label="Child Price (USD)"
            type="number"
            value={pkg.child_price}
            onChange={(e) => updatePackage(index, 'child_price', Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Min Group Size"
            type="number"
            value={pkg.min_group_size}
            onChange={(e) => updatePackage(index, 'min_group_size', Number(e.target.value))}
          />
          <Input
            label="Max Group Size"
            type="number"
            value={pkg.max_group_size}
            onChange={(e) => updatePackage(index, 'max_group_size', Number(e.target.value))}
          />
        </div>
      </div>
    ))}

    <Button onClick={addPackage}>
      <Plus className="w-4 h-4 mr-2" />
      Add Package Variant
    </Button>
  </CardContent>
</Card>
```

### Option B: Dedicated Package Management Page

Create a new page for comprehensive package management:

```typescript
// app/admin/experiences/[id]/packages/page.tsx

export default function PackageManagementPage() {
  // Full package, pricing tier, add-on, and seasonal pricing management
  // See complete example in the repository
}
```

---

## Step 3: Create API Endpoints

### Create Package

```typescript
// app/api/admin/packages/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();

  // Create package
  const { data: package, error: pkgError } = await supabase
    .from('experience_packages')
    .insert({
      experience_id: body.experience_id,
      package_name: body.package_name,
      package_code: body.package_code,
      description: body.description,
      min_group_size: body.min_group_size,
      max_group_size: body.max_group_size,
      inclusions: body.inclusions,
      exclusions: body.exclusions,
    })
    .select()
    .single();

  if (pkgError) {
    return NextResponse.json({ error: pkgError.message }, { status: 500 });
  }

  // Create pricing tiers
  const pricingTiers = [];

  if (body.adult_price) {
    pricingTiers.push({
      package_id: package.id,
      tier_type: 'adult',
      tier_label: 'Adult (18+ years)',
      min_age: 18,
      base_price: body.adult_price,
    });
  }

  if (body.child_price) {
    pricingTiers.push({
      package_id: package.id,
      tier_type: 'child',
      tier_label: 'Child (3-17 years)',
      min_age: 3,
      max_age: 17,
      base_price: body.child_price,
    });
  }

  if (pricingTiers.length > 0) {
    await supabase.from('package_pricing_tiers').insert(pricingTiers);
  }

  return NextResponse.json({ package }, { status: 201 });
}
```

### Calculate Price

```typescript
// app/api/pricing/calculate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { calculatePackagePrice } from '@/lib/utils/pricing-calculator';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const input = await request.json();

  // Fetch pricing data
  const { data: package } = await supabase
    .from('experience_packages')
    .select('*')
    .eq('id', input.package_id)
    .single();

  const { data: pricingTiers } = await supabase
    .from('package_pricing_tiers')
    .select('*')
    .eq('package_id', input.package_id)
    .eq('is_active', true);

  const { data: groupPricing } = await supabase
    .from('package_group_pricing')
    .select('*')
    .eq('package_id', input.package_id)
    .eq('is_active', true);

  const { data: seasonalPricing } = await supabase
    .from('package_seasonal_pricing')
    .select('*')
    .eq('package_id', input.package_id)
    .eq('is_active', true);

  const { data: timeBasedDiscounts } = await supabase
    .from('package_time_based_discounts')
    .select('*')
    .eq('package_id', input.package_id)
    .eq('is_active', true);

  const { data: addons } = await supabase
    .from('package_addons')
    .select('*')
    .eq('package_id', input.package_id)
    .eq('is_active', true);

  const { data: promotions } = await supabase
    .from('package_promotions')
    .select('*')
    .eq('is_active', true);

  // Calculate price
  const result = calculatePackagePrice(input, {
    pricing_tiers: pricingTiers || [],
    group_pricing: groupPricing || [],
    seasonal_pricing: seasonalPricing || [],
    time_based_discounts: timeBasedDiscounts || [],
    addons: addons || [],
    promotions: promotions || [],
  });

  return NextResponse.json(result);
}
```

---

## Step 4: Create Admin UI Components

### Package Card Component

```typescript
// components/admin/PackageCard.tsx

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PackageWithPricing } from '@/types/pricing';
import { formatPrice } from '@/lib/utils/pricing-calculator';

interface PackageCardProps {
  package: PackageWithPricing;
  onEdit: () => void;
  onDelete: () => void;
}

export function PackageCard({ package: pkg, onEdit, onDelete }: PackageCardProps) {
  const adultTier = pkg.pricing_tiers.find(t => t.tier_type === 'adult');
  const childTier = pkg.pricing_tiers.find(t => t.tier_type === 'child');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{pkg.package_name}</CardTitle>
            {pkg.package_code && (
              <Badge variant="outline" className="mt-2">
                {pkg.package_code}
              </Badge>
            )}
          </div>
          <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
            {pkg.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {pkg.description && (
          <p className="text-sm text-muted-foreground">{pkg.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Adult Price</p>
            <p className="text-2xl font-bold">
              {adultTier ? formatPrice(adultTier.base_price) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="font-medium">Child Price</p>
            <p className="text-2xl font-bold">
              {childTier ? formatPrice(childTier.base_price) : 'N/A'}
            </p>
          </div>
        </div>

        <div className="text-sm space-y-1">
          <p>
            <span className="font-medium">Group Size:</span>{' '}
            {pkg.min_group_size} - {pkg.max_group_size} pax
          </p>
          {pkg.inclusions && pkg.inclusions.length > 0 && (
            <p>
              <span className="font-medium">Inclusions:</span>{' '}
              {pkg.inclusions.length} items
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit Package
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Price Calculator Widget

```typescript
// components/admin/PriceCalculatorWidget.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils/pricing-calculator';
import { PriceCalculationResult } from '@/types/pricing';

interface PriceCalculatorWidgetProps {
  packageId: string;
}

export function PriceCalculatorWidget({ packageId }: PriceCalculatorWidgetProps) {
  const [travelDate, setTravelDate] = useState('');
  const [adultCount, setAdultCount] = useState(2);
  const [childCount, setChildCount] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [result, setResult] = useState<PriceCalculationResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calculatePrice = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/pricing/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package_id: packageId,
          travel_date: travelDate,
          adult_count: adultCount,
          child_count: childCount,
          promo_code: promoCode || undefined,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Failed to calculate price:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Price Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Travel Date</Label>
          <Input
            type="date"
            value={travelDate}
            onChange={(e) => setTravelDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Adults</Label>
            <Input
              type="number"
              min={0}
              value={adultCount}
              onChange={(e) => setAdultCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Children</Label>
            <Input
              type="number"
              min={0}
              value={childCount}
              onChange={(e) => setChildCount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Promo Code (Optional)</Label>
          <Input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value)}
            placeholder="Enter promo code"
          />
        </div>

        <Button onClick={calculatePrice} disabled={loading || !travelDate}>
          {loading ? 'Calculating...' : 'Calculate Price'}
        </Button>

        {result && (
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Base Price:</span>
              <span>{formatPrice(result.base_price, result.currency)}</span>
            </div>

            {result.seasonal_adjustment > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Seasonal Adjustment:</span>
                <span>+{formatPrice(result.seasonal_adjustment, result.currency)}</span>
              </div>
            )}

            {result.group_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Group Discount:</span>
                <span>-{formatPrice(result.group_discount, result.currency)}</span>
              </div>
            )}

            {result.time_based_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Early Bird Discount:</span>
                <span>-{formatPrice(result.time_based_discount, result.currency)}</span>
              </div>
            )}

            {result.promo_discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Promo Code:</span>
                <span>-{formatPrice(result.promo_discount, result.currency)}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total Price:</span>
              <span>{formatPrice(result.total_price, result.currency)}</span>
            </div>

            <p className="text-xs text-muted-foreground">
              {result.total_passengers} passengers • {result.days_before_travel} days in advance
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Step 5: Testing

### Test Scenarios

1. **Basic Pricing**
   - Create a package with adult and child pricing
   - Calculate price for 2 adults, 1 child
   - Verify correct total

2. **Seasonal Pricing**
   - Add peak season (e.g., Christmas)
   - Calculate price for travel during peak season
   - Verify adjustment is applied

3. **Group Discount**
   - Add group discount (10+ pax = 15% off)
   - Calculate price for 12 adults
   - Verify discount is applied

4. **Early Bird**
   - Add early bird discount (60+ days = 15% off)
   - Calculate price 75 days in advance
   - Verify discount is applied

5. **Promo Code**
   - Create promo code "WELCOME10" = 10% off
   - Calculate price with promo code
   - Verify discount is applied

6. **Combined Discounts**
   - Test multiple discounts together
   - Verify calculation order is correct
   - Ensure no negative totals

---

## Step 6: Rollout Strategy

### Phase 1: Soft Launch (Week 1)
- Apply database migration
- Migrate existing experiences to Standard Package
- Test admin interface with sample data
- Train staff on new system

### Phase 2: Parallel Run (Week 2-3)
- Keep old pricing system active
- Use new system for new experiences only
- Compare pricing calculations
- Fix any discrepancies

### Phase 3: Full Migration (Week 4)
- Switch all experiences to new system
- Deprecate old pricing fields
- Update all booking flows
- Monitor for issues

### Phase 4: Advanced Features (Month 2+)
- Add Premium/Luxury package variants
- Set up seasonal pricing
- Configure group discounts
- Launch promotional campaigns

---

## Common Tasks

### Add a New Package Variant

```typescript
// 1. Create package
const package = await supabase
  .from('experience_packages')
  .insert({
    experience_id: experienceId,
    package_name: 'Premium Package',
    package_code: 'PREM',
    description: 'Enhanced experience with premium inclusions',
    min_group_size: 2,
    max_group_size: 10,
    inclusions: ['Premium transport', 'Gourmet lunch', 'Professional guide'],
    exclusions: ['Alcoholic beverages', 'Personal expenses'],
  })
  .select()
  .single();

// 2. Add pricing tiers
await supabase.from('package_pricing_tiers').insert([
  {
    package_id: package.id,
    tier_type: 'adult',
    tier_label: 'Adult (18+ years)',
    base_price: 150,
  },
  {
    package_id: package.id,
    tier_type: 'child',
    tier_label: 'Child (3-17 years)',
    base_price: 105,
  },
]);
```

### Set Up Seasonal Pricing

```typescript
await supabase.from('package_seasonal_pricing').insert({
  package_id: packageId,
  season_name: 'Peak Season (Dec-Feb)',
  start_date: '2025-12-01',
  end_date: '2026-02-28',
  adjustment_type: 'percentage',
  adjustment_value: 25, // 25% increase
  priority: 10,
});
```

### Create Group Discount

```typescript
await supabase.from('package_group_pricing').insert({
  package_id: packageId,
  min_pax: 10,
  max_pax: 99,
  pricing_type: 'discount_percentage',
  discount_percentage: 15,
});
```

### Add Early Bird Discount

```typescript
await supabase.from('package_time_based_discounts').insert({
  package_id: packageId,
  discount_name: 'Early Bird 60 Days',
  discount_type: 'early_bird',
  days_before_travel: 60,
  comparison: 'greater_than',
  discount_amount_type: 'percentage',
  discount_value: 15,
});
```

### Create Promo Code

```typescript
await supabase.from('package_promotions').insert({
  promotion_code: 'SUMMER25',
  promotion_name: 'Summer Sale 2025',
  description: '25% off all summer bookings',
  discount_type: 'percentage',
  discount_value: 25,
  valid_from: '2025-06-01T00:00:00Z',
  valid_to: '2025-08-31T23:59:59Z',
  max_uses: 100,
  max_uses_per_customer: 1,
});
```

---

## Support & Resources

- **Documentation**: [/docs/PRICING_SYSTEM.md](/docs/PRICING_SYSTEM.md)
- **TypeScript Types**: [/types/pricing.ts](/types/pricing.ts)
- **Calculator Utility**: [/lib/utils/pricing-calculator.ts](/lib/utils/pricing-calculator.ts)
- **Migration Script**: [/supabase/migrations/add_package_pricing_system.sql](/supabase/migrations/add_package_pricing_system.sql)

---

## Next Steps

1. ✅ Apply database migration
2. ✅ Create API endpoints
3. ✅ Build admin UI components
4. ✅ Test with sample data
5. ✅ Train your team
6. ✅ Roll out to production

Happy building! 🚀
