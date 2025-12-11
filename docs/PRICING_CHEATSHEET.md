# Pricing System Quick Reference Cheat Sheet

## Database Tables Quick Reference

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `experience_packages` | Package variants (Standard, Premium, Luxury) | `package_name`, `min_group_size`, `max_group_size` |
| `package_pricing_tiers` | Age-based pricing | `tier_type`, `base_price`, `min_age`, `max_age` |
| `package_group_pricing` | Volume discounts | `min_pax`, `max_pax`, `pricing_type`, `discount_percentage` |
| `package_seasonal_pricing` | Peak/off-peak rates | `start_date`, `end_date`, `adjustment_type`, `adjustment_value` |
| `package_time_based_discounts` | Early bird & last minute | `discount_type`, `days_before_travel`, `discount_value` |
| `package_addons` | Optional extras | `addon_name`, `pricing_type`, `price` |
| `package_promotions` | Promo codes | `promotion_code`, `discount_type`, `discount_value` |
| `package_departure_pricing` | Specific departure dates | `departure_date`, `available_slots`, `has_custom_pricing` |

---

## Common SQL Queries

### Get All Packages for an Experience
```sql
SELECT * FROM experience_packages
WHERE experience_id = 'your-experience-id'
  AND is_active = true
ORDER BY display_order;
```

### Get Package with All Pricing Data
```sql
SELECT
  ep.*,
  json_agg(DISTINCT pt.*) as pricing_tiers,
  json_agg(DISTINCT gp.*) as group_pricing,
  json_agg(DISTINCT sp.*) as seasonal_pricing
FROM experience_packages ep
LEFT JOIN package_pricing_tiers pt ON pt.package_id = ep.id AND pt.is_active = true
LEFT JOIN package_group_pricing gp ON gp.package_id = ep.id AND gp.is_active = true
LEFT JOIN package_seasonal_pricing sp ON sp.package_id = ep.id AND sp.is_active = true
WHERE ep.id = 'package-id'
GROUP BY ep.id;
```

### Create Standard Package
```sql
INSERT INTO experience_packages (
  experience_id, package_name, package_code, min_group_size, max_group_size
) VALUES (
  'exp-123', 'Standard Package', 'STD', 2, 15
) RETURNING id;
```

### Add Pricing Tiers
```sql
INSERT INTO package_pricing_tiers (package_id, tier_type, tier_label, base_price) VALUES
  ('pkg-123', 'adult', 'Adult (18+ years)', 100),
  ('pkg-123', 'child', 'Child (3-17 years)', 70);
```

### Set Seasonal Pricing
```sql
INSERT INTO package_seasonal_pricing (
  package_id, season_name, start_date, end_date, adjustment_type, adjustment_value, priority
) VALUES (
  'pkg-123', 'Peak Season', '2025-12-01', '2026-02-28', 'percentage', 25, 10
);
```

### Add Group Discount
```sql
INSERT INTO package_group_pricing (
  package_id, min_pax, max_pax, pricing_type, discount_percentage
) VALUES (
  'pkg-123', 10, 99, 'discount_percentage', 15
);
```

### Create Promo Code
```sql
INSERT INTO package_promotions (
  promotion_code, promotion_name, discount_type, discount_value,
  valid_from, valid_to, max_uses
) VALUES (
  'SUMMER25', 'Summer Sale 2025', 'percentage', 25,
  '2025-06-01', '2025-08-31', 100
);
```

---

## TypeScript Usage

### Import Types
```typescript
import type {
  ExperiencePackage,
  PackagePricingTier,
  PriceCalculationInput,
  PriceCalculationResult,
} from '@/types/pricing';
```

### Calculate Price
```typescript
import { calculatePackagePrice } from '@/lib/utils/pricing-calculator';

const input: PriceCalculationInput = {
  package_id: 'pkg-123',
  travel_date: '2025-07-15',
  booking_date: '2025-05-01',
  adult_count: 2,
  child_count: 1,
  promo_code: 'SUMMER25',
  addon_ids: ['addon-transfer', 'addon-photo'],
};

const result = calculatePackagePrice(input, pricingData);

console.log(`Total: ${result.total_price}`);
console.log(`Saved: ${result.promo_discount + result.time_based_discount}`);
```

### Format Price
```typescript
import { formatPrice } from '@/lib/utils/pricing-calculator';

const formatted = formatPrice(125.50, 'USD'); // "$125.50"
```

---

## API Endpoints Quick Reference

### Calculate Price
```http
POST /api/pricing/calculate
Content-Type: application/json

{
  "package_id": "uuid",
  "travel_date": "2025-07-15",
  "adult_count": 2,
  "child_count": 1,
  "promo_code": "SUMMER25"
}
```

### Create Package
```http
POST /api/admin/packages
Content-Type: application/json

{
  "experience_id": "uuid",
  "package_name": "Standard Package",
  "package_code": "STD",
  "min_group_size": 2,
  "max_group_size": 15,
  "adult_price": 100,
  "child_price": 70
}
```

### Update Package
```http
PUT /api/admin/packages/:id
Content-Type: application/json

{
  "package_name": "Premium Package",
  "adult_price": 150,
  "child_price": 105
}
```

---

## Pricing Strategy Templates

### Budget Experience (Under $100)
```
Standard Package:
  Adult: $60-85
  Child: $40-60
  Min: 2 pax, Max: 20 pax

Group Discounts:
  5-9 pax: 5% off
  10+ pax: 10% off

Early Bird:
  60+ days: 10% off
  30+ days: 5% off
```

### Mid-Range Experience ($100-200)
```
Standard Package:
  Adult: $100-130
  Child: $70-90

Premium Package:
  Adult: $150-180
  Child: $105-125

Group Discounts:
  5-9 pax: 8% off
  10+ pax: 12% off

Seasonal:
  Peak: +20%
  Off-peak: -10%

Early Bird:
  90+ days: 15% off
  60+ days: 10% off
```

### Luxury Experience ($200+)
```
Premium Package:
  Adult: $200-300
  Child: $140-210

Luxury Package:
  Adult: $350-500
  Child: $245-350

Group Discounts:
  Limited (max 8 pax)
  No volume discounts

Seasonal:
  Peak: +30-50%

Early Bird:
  90+ days: 20% off
```

---

## Common Calculations Cheat Sheet

### Calculate Percentage Discount
```typescript
const discount = basePrice * (percentage / 100);
const finalPrice = basePrice - discount;
```

### Calculate Fixed Discount
```typescript
const finalPrice = Math.max(0, basePrice - discountAmount);
```

### Calculate Per-Person from Group Rate
```typescript
const perPersonPrice = groupRate / numberOfPeople;
```

### Calculate Total from Multiple Tiers
```typescript
const total = (adultPrice * adultCount) +
              (childPrice * childCount) +
              (seniorPrice * seniorCount);
```

### Calculate Days Before Travel
```typescript
const daysBeforeTravel = Math.ceil(
  (new Date(travelDate).getTime() - new Date().getTime()) /
  (1000 * 60 * 60 * 24)
);
```

---

## Discount Priority Order

```
1. Base Price (from tiers)
   ↓
2. + Seasonal Adjustment
   ↓
3. - Group Discount
   ↓
4. - Time-based Discount
   ↓
5. - Promo Code
   ↓
6. + Add-ons
   ↓
7. = Final Price
```

**Important**: Each discount is calculated on the running total after previous adjustments.

---

## Quick Setup Checklist

### For Each New Experience

- [ ] Create experience in `experiences` table
- [ ] Create at least one package in `experience_packages`
- [ ] Add pricing tiers (adult, child at minimum)
- [ ] Set group size constraints
- [ ] Configure seasonal pricing (if applicable)
- [ ] Set up group discounts (optional)
- [ ] Create early bird discounts (optional)
- [ ] Add optional add-ons (optional)
- [ ] Test price calculation
- [ ] Publish to frontend

---

## Common Pricing Scenarios

### Scenario 1: Simple Pricing (No Discounts)
```
Base: $200
Seasonal: $0
Group: $0
Early Bird: $0
Promo: $0
Total: $200
```

### Scenario 2: Peak Season with Early Bird
```
Base: $200
Seasonal: +$50 (25%)
Subtotal: $250
Early Bird: -$37.50 (15% of $250)
Total: $212.50
```

### Scenario 3: Large Group in Off-Peak
```
Base: $2,000 (10 adults × $200)
Seasonal: -$200 (10% off-peak)
Subtotal: $1,800
Group: -$270 (15% for 10+ pax)
Total: $1,530
Per person: $153
```

### Scenario 4: All Discounts Stack
```
Base: $1,000 (5 adults × $200)
Seasonal: +$100 (10% peak)
Subtotal: $1,100
Group: -$55 (5% for 5 pax)
Early Bird: -$104.50 (10% of $1,045)
Promo: -$94.05 (10% of $940.45)
Total: $846.40
```

---

## Validation Rules

### Group Size
```typescript
if (totalPassengers < minGroupSize) {
  throw new Error(`Minimum ${minGroupSize} passengers required`);
}
if (totalPassengers > maxGroupSize) {
  throw new Error(`Maximum ${maxGroupSize} passengers allowed`);
}
```

### Date Ranges
```typescript
if (travelDate < new Date()) {
  throw new Error('Travel date must be in the future');
}
if (availableFrom && travelDate < new Date(availableFrom)) {
  throw new Error('Experience not available on this date');
}
```

### Promo Code
```typescript
if (promo.current_uses >= promo.max_uses) {
  throw new Error('Promo code has reached maximum uses');
}
if (currentPrice < promo.min_purchase_amount) {
  throw new Error(`Minimum purchase of ${promo.min_purchase_amount} required`);
}
```

---

## Performance Tips

### Optimize Queries
```typescript
// ✅ Good: Single query with joins
const packageWithPricing = await supabase
  .from('experience_packages')
  .select(`
    *,
    pricing_tiers:package_pricing_tiers(*),
    group_pricing:package_group_pricing(*),
    seasonal_pricing:package_seasonal_pricing(*)
  `)
  .eq('id', packageId)
  .single();

// ❌ Bad: Multiple queries
const package = await supabase.from('experience_packages').select('*').eq('id', packageId).single();
const tiers = await supabase.from('package_pricing_tiers').select('*').eq('package_id', packageId);
const groupPricing = await supabase.from('package_group_pricing').select('*').eq('package_id', packageId);
```

### Cache Pricing Data
```typescript
// Cache package pricing data for 5 minutes
const CACHE_TTL = 5 * 60 * 1000;
const cachedPricing = new Map<string, { data: any; expires: number }>();

function getCachedPricing(packageId: string) {
  const cached = cachedPricing.get(packageId);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }
  return null;
}
```

---

## Testing Commands

### Test Database Migration
```bash
# Apply migration
supabase db push

# Verify tables exist
psql -c "\dt package_*"

# Check sample data
psql -c "SELECT * FROM experience_packages LIMIT 5;"
```

### Test Price Calculation
```bash
# Using curl
curl -X POST http://localhost:3000/api/pricing/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "package_id": "pkg-123",
    "travel_date": "2025-07-15",
    "adult_count": 2
  }'
```

---

## Troubleshooting

### Discount Not Applying
- [ ] Check `is_active` flag
- [ ] Verify date ranges
- [ ] Confirm passenger count meets minimum
- [ ] Check promo code spelling

### Wrong Price Calculated
- [ ] Verify seasonal pricing priority
- [ ] Check discount order (see priority section)
- [ ] Confirm base prices are correct
- [ ] Test with simple scenario first

### Package Not Showing
- [ ] Check `is_active` flag
- [ ] Verify experience_id reference
- [ ] Confirm date availability
- [ ] Check group size constraints

---

## Resources

- **Full Documentation**: `/docs/PRICING_SYSTEM.md`
- **Implementation Guide**: `/docs/IMPLEMENTATION_GUIDE.md`
- **Real Examples**: `/docs/PRICING_EXAMPLES.md`
- **Type Definitions**: `/types/pricing.ts`
- **Calculator Code**: `/lib/utils/pricing-calculator.ts`
- **Migration Script**: `/supabase/migrations/add_package_pricing_system.sql`

---

## Need Help?

1. Check the full documentation first
2. Review the pricing examples
3. Test with simple scenarios
4. Gradually add complexity

**Pro Tip**: Start with one package and basic pricing. Add advanced features (seasonal, groups, promos) after you're comfortable with the basics.
