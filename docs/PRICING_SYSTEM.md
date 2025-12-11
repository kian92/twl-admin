# Professional Travel Agency Pricing System

## Overview

This document describes the comprehensive pricing system designed for a professional travel agency admin platform. The system supports multiple package variants, age-based pricing, seasonal rates, group discounts, time-based promotions, add-ons, and promotional codes.

## Table of Contents

1. [Key Features](#key-features)
2. [Database Schema](#database-schema)
3. [Pricing Components](#pricing-components)
4. [Usage Examples](#usage-examples)
5. [API Integration](#api-integration)
6. [Best Practices](#best-practices)

---

## Key Features

### 1. **Multiple Package Variants**
- Offer different service levels for the same experience (Standard, Premium, Luxury)
- Each package has its own inclusions, exclusions, and constraints
- Flexible group size requirements per package

### 2. **Age-Based Pricing Tiers**
- **Adult** (typically 18+ years)
- **Child** (typically 3-17 years)
- **Infant** (typically 0-2 years)
- **Senior** (typically 65+ years)
- **Student** (with valid ID)

### 3. **Dynamic Pricing**
- **Seasonal Pricing**: Peak season, off-peak, holiday rates
- **Group Discounts**: Volume discounts based on group size
- **Early Bird Discounts**: Savings for booking in advance
- **Last Minute Deals**: Discounts for late bookings

### 4. **Add-ons and Extras**
- Optional services (transfers, photography, meals, insurance)
- Can be priced per person, per group, or per unit
- Support for required vs. optional add-ons

### 5. **Promotional System**
- Promo codes with percentage or fixed amount discounts
- Buy X Get Y offers
- Usage limits and validity periods
- Minimum purchase requirements

### 6. **Departure Management**
- Specific departure dates with custom pricing
- Real-time availability tracking
- Slot management and overbooking prevention

---

## Database Schema

### Core Tables

#### 1. `experience_packages`
Defines package variants (Standard, Premium, Luxury) for each experience.

```sql
CREATE TABLE experience_packages (
  id UUID PRIMARY KEY,
  experience_id UUID REFERENCES experiences(id),
  package_name TEXT NOT NULL,
  package_code TEXT,
  description TEXT,
  min_group_size INTEGER DEFAULT 1,
  max_group_size INTEGER DEFAULT 15,
  available_from DATE,
  available_to DATE,
  inclusions TEXT[],
  exclusions TEXT[],
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

**Example:**
- Standard Package: Basic inclusions, lower price
- Premium Package: Enhanced inclusions, mid-tier price
- Luxury Package: All-inclusive, premium price

#### 2. `package_pricing_tiers`
Age-based pricing for each package.

```sql
CREATE TABLE package_pricing_tiers (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES experience_packages(id),
  tier_type TEXT CHECK (tier_type IN ('adult', 'child', 'infant', 'senior', 'student')),
  tier_label TEXT,
  min_age INTEGER,
  max_age INTEGER,
  base_price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  cost_price NUMERIC,
  is_active BOOLEAN DEFAULT true
);
```

**Example:**
- Adult (18-64): $120
- Child (3-17): $85
- Infant (0-2): $20
- Senior (65+): $100

#### 3. `package_group_pricing`
Volume discounts based on group size.

```sql
CREATE TABLE package_group_pricing (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES experience_packages(id),
  min_pax INTEGER NOT NULL,
  max_pax INTEGER NOT NULL,
  pricing_type TEXT CHECK (pricing_type IN
    ('per_person', 'per_group', 'discount_percentage', 'discount_amount')),
  price_per_person NUMERIC,
  price_per_group NUMERIC,
  discount_percentage NUMERIC,
  discount_amount NUMERIC,
  applies_to_tier_type TEXT,
  is_active BOOLEAN DEFAULT true
);
```

**Example:**
- 2-4 people: 5% discount
- 5-9 people: 10% discount
- 10+ people: 15% discount

#### 4. `package_seasonal_pricing`
Seasonal rate adjustments.

```sql
CREATE TABLE package_seasonal_pricing (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES experience_packages(id),
  season_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  adjustment_type TEXT CHECK (adjustment_type IN
    ('percentage', 'fixed_amount', 'override_price')),
  adjustment_value NUMERIC NOT NULL,
  applies_to_tier_type TEXT,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

**Example:**
- Peak Season (Dec-Feb): +25%
- Holiday Season (Christmas): +$50 per person
- Off-Peak (Jun-Aug): -15%

#### 5. `package_time_based_discounts`
Early bird and last-minute discounts.

```sql
CREATE TABLE package_time_based_discounts (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES experience_packages(id),
  discount_name TEXT NOT NULL,
  discount_type TEXT CHECK (discount_type IN ('early_bird', 'last_minute')),
  days_before_travel INTEGER NOT NULL,
  comparison TEXT CHECK (comparison IN ('greater_than', 'less_than', 'equal_to')),
  discount_amount_type TEXT CHECK (discount_amount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL,
  valid_from DATE,
  valid_to DATE,
  applies_to_tier_type TEXT,
  is_active BOOLEAN DEFAULT true
);
```

**Example:**
- Early Bird 60 days: 15% off
- Early Bird 30 days: 10% off
- Last Minute 7 days: $30 off

#### 6. `package_addons`
Optional extras and services.

```sql
CREATE TABLE package_addons (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES experience_packages(id),
  addon_name TEXT NOT NULL,
  addon_code TEXT,
  description TEXT,
  pricing_type TEXT CHECK (pricing_type IN ('per_person', 'per_group', 'per_unit')),
  price NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  min_quantity INTEGER DEFAULT 1,
  max_quantity INTEGER,
  is_required BOOLEAN DEFAULT false,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);
```

**Example:**
- Private Transfer: $80 per group
- Professional Photography: $50 per person
- Travel Insurance: $15 per person
- Lunch Upgrade: $25 per person

#### 7. `package_promotions`
Promotional codes and special offers.

```sql
CREATE TABLE package_promotions (
  id UUID PRIMARY KEY,
  promotion_code TEXT NOT NULL UNIQUE,
  promotion_name TEXT NOT NULL,
  description TEXT,
  discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y')),
  discount_value NUMERIC,
  buy_quantity INTEGER,
  get_quantity INTEGER,
  package_ids UUID[],
  valid_from TIMESTAMP NOT NULL,
  valid_to TIMESTAMP NOT NULL,
  max_uses INTEGER,
  max_uses_per_customer INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  min_purchase_amount NUMERIC,
  min_pax INTEGER,
  is_active BOOLEAN DEFAULT true
);
```

**Example:**
- SUMMER25: 25% off all packages
- WELCOME50: $50 off first booking
- BUY2GET1: Buy 2 get 1 free

#### 8. `package_departure_pricing`
Specific departure dates with availability tracking.

```sql
CREATE TABLE package_departure_pricing (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES experience_packages(id),
  departure_date DATE NOT NULL,
  departure_time TIME,
  available_slots INTEGER NOT NULL,
  booked_slots INTEGER DEFAULT 0,
  has_custom_pricing BOOLEAN DEFAULT false,
  custom_adult_price NUMERIC,
  custom_child_price NUMERIC,
  custom_infant_price NUMERIC,
  custom_senior_price NUMERIC,
  status TEXT CHECK (status IN ('available', 'limited', 'sold_out', 'cancelled')),
  guide_name TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true
);
```

---

## Pricing Components

### Price Calculation Flow

```
1. Base Price (from pricing tiers)
   ↓
2. + Seasonal Adjustment
   ↓
3. - Group Discount
   ↓
4. - Time-based Discount (Early Bird / Last Minute)
   ↓
5. - Promotional Code Discount
   ↓
6. + Add-ons Total
   ↓
7. = Final Total Price
```

### Priority Rules

When multiple discounts/adjustments apply:

1. **Seasonal pricing** is applied first (additive)
2. **Group discounts** are applied to the seasonally-adjusted price
3. **Time-based discounts** are applied after group discounts
4. **Promotional codes** are applied last (before add-ons)
5. **Add-ons** are added to the final discounted price

If seasonal pricing rules overlap, **highest priority** wins.

---

## Usage Examples

### Example 1: Family Booking with Early Bird Discount

**Scenario:**
- Package: Bali Sunrise Trek (Standard)
- Travel Date: July 15, 2025
- Booking Date: May 1, 2025 (75 days in advance)
- Passengers: 2 Adults, 1 Child
- Promo Code: None

**Calculation:**

```typescript
const input: PriceCalculationInput = {
  package_id: 'pkg-123',
  travel_date: '2025-07-15',
  booking_date: '2025-05-01',
  adult_count: 2,
  child_count: 1,
};

const result = calculatePackagePrice(input, pricingData);

// Result:
// Base: $250 (2 × $85 + 1 × $80)
// Seasonal: +$0 (no adjustment)
// Group: -$0 (only 3 pax)
// Early Bird (60+ days): -$37.50 (15%)
// Promo: -$0
// Add-ons: +$0
// Total: $212.50
```

### Example 2: Large Group with Peak Season

**Scenario:**
- Package: Tokyo Food Tour (Premium)
- Travel Date: December 25, 2025 (Christmas)
- Booking Date: December 1, 2025
- Passengers: 12 Adults
- Promo Code: WINTER10

**Calculation:**

```typescript
const input: PriceCalculationInput = {
  package_id: 'pkg-456',
  travel_date: '2025-12-25',
  booking_date: '2025-12-01',
  adult_count: 12,
  promo_code: 'WINTER10',
};

// Base: $1,200 (12 × $100)
// Seasonal (Christmas): +$300 (25% peak season)
// Group (10+): -$225 (15% group discount on $1,500)
// Early Bird: -$0 (not far enough in advance)
// Promo (WINTER10): -$127.50 (10% of $1,275)
// Total: $1,147.50
```

### Example 3: Luxury Package with Add-ons

**Scenario:**
- Package: Santorini Sailing (Luxury)
- Travel Date: June 10, 2025
- Passengers: 2 Adults
- Add-ons:
  - Private Transfer: $120 (per group)
  - Professional Photography: $100 ($50 × 2)

**Calculation:**

```typescript
const input: PriceCalculationInput = {
  package_id: 'pkg-789',
  travel_date: '2025-06-10',
  adult_count: 2,
  addon_ids: ['addon-transfer', 'addon-photo'],
  addon_quantities: { 'addon-transfer': 1, 'addon-photo': 2 },
};

// Base: $400 (2 × $200)
// Seasonal: +$0
// Group: -$0
// Early Bird: -$0
// Promo: -$0
// Add-ons: +$220 ($120 + $100)
// Total: $620
```

---

## API Integration

### Calculate Price Endpoint

**POST** `/api/pricing/calculate`

```typescript
// Request
{
  "package_id": "uuid",
  "travel_date": "2025-07-15",
  "booking_date": "2025-05-01",
  "adult_count": 2,
  "child_count": 1,
  "promo_code": "SUMMER25",
  "addon_ids": ["addon-1", "addon-2"]
}

// Response
{
  "total_price": 425.50,
  "base_price": 500.00,
  "currency": "USD",
  "seasonal_adjustment": 50.00,
  "group_discount": 0,
  "time_based_discount": 75.00,
  "promo_discount": 49.50,
  "addons_total": 0,
  "breakdown": {
    "pricing_tiers": [
      { "tier_type": "adult", "count": 2, "unit_price": 150, "subtotal": 300 },
      { "tier_type": "child", "count": 1, "unit_price": 100, "subtotal": 100 }
    ],
    "seasonal_pricing": {
      "season_name": "Peak Season",
      "adjustment_type": "percentage",
      "adjustment_value": 10,
      "applied_amount": 50.00
    },
    "time_based_discount": {
      "discount_name": "Early Bird 60 Days",
      "discount_type": "early_bird",
      "days_before_travel": 75,
      "applied_amount": 75.00
    },
    "promotion": {
      "promotion_code": "SUMMER25",
      "promotion_name": "Summer Sale",
      "applied_amount": 49.50
    }
  },
  "total_passengers": 3,
  "days_before_travel": 75
}
```

---

## Best Practices

### 1. **Package Design**

**Standard Package:**
- Essential inclusions only
- Competitive base pricing
- Target budget-conscious travelers

**Premium Package:**
- Enhanced inclusions (better meals, accommodation)
- Mid-tier pricing
- Most popular option

**Luxury Package:**
- All-inclusive experience
- Premium pricing
- Exclusive extras and personalized service

### 2. **Pricing Strategy**

**Base Pricing:**
- Research competitor pricing
- Calculate costs accurately (include guide, transport, meals, permits)
- Add desired profit margin (typically 20-40%)

**Seasonal Pricing:**
- Identify peak demand periods
- Apply higher rates during holidays and peak seasons
- Offer discounts during slow periods to maintain bookings

**Group Discounts:**
- Incentivize larger groups
- Typical structure:
  - 2-4 pax: 5% off
  - 5-9 pax: 10% off
  - 10-15 pax: 15% off
  - 15+ pax: Custom quote

**Time-based Discounts:**
- Early Bird: Reward advance bookings
  - 60+ days: 15% off
  - 30-59 days: 10% off
- Last Minute: Fill empty slots
  - 7-14 days: $20-$50 off
  - 0-6 days: $30-$100 off

### 3. **Add-on Pricing**

**Transportation:**
- Private transfers
- Airport pickup/drop-off
- Premium vehicle upgrades

**Activities:**
- Optional excursions
- Extended tours
- VIP experiences

**Services:**
- Professional photography
- Travel insurance
- Equipment rentals

**Meals:**
- Lunch/dinner upgrades
- Special dietary menus
- Alcoholic beverages

### 4. **Promotional Strategy**

**Welcome Offers:**
- First-time customer discounts
- Email list signup incentives

**Seasonal Campaigns:**
- Holiday promotions
- Summer/winter sales
- Flash sales

**Loyalty Programs:**
- Repeat customer discounts
- Referral bonuses
- VIP member rates

### 5. **Inventory Management**

**Departure Dates:**
- Create specific departures in advance
- Set realistic available slots
- Monitor booking velocity
- Adjust pricing based on demand

**Overbooking Protection:**
- Always check available slots before confirming
- Implement automatic status updates (available → limited → sold out)
- Send notifications when departures fill up

---

## Migration from Legacy System

If you have an existing `experiences` table with simple `adult_price` and `child_price` fields:

### Step 1: Run the migration SQL
```bash
psql -f supabase/migrations/add_package_pricing_system.sql
```

### Step 2: Migrate existing data
The migration automatically creates a "Standard Package" for each experience with the existing pricing.

### Step 3: Update your application code
Replace direct price references with package-based pricing queries.

**Before:**
```typescript
const price = experience.adult_price;
```

**After:**
```typescript
const packages = await getExperiencePackages(experience.id);
const standardPackage = packages.find(p => p.package_code === 'STD');
const adultTier = standardPackage.pricing_tiers.find(t => t.tier_type === 'adult');
const price = adultTier.base_price;
```

---

## Troubleshooting

### Common Issues

**1. Discount not applying**
- Check `is_active` flag
- Verify date ranges (valid_from, valid_to)
- Confirm minimum requirements are met (min_pax, min_purchase_amount)

**2. Wrong seasonal pricing**
- Check priority values if seasons overlap
- Verify date ranges
- Ensure travel_date falls within range

**3. Group discount calculation error**
- Verify min_pax and max_pax ranges don't overlap
- Check pricing_type is set correctly
- Ensure discount values are positive numbers

**4. Promo code not working**
- Check spelling and case sensitivity
- Verify validity dates
- Confirm max_uses limit not reached
- Check package_ids filter

---

## Future Enhancements

### Planned Features

1. **Dynamic Pricing Engine**
   - Real-time demand-based pricing
   - Competitor price monitoring
   - AI-powered price optimization

2. **Multi-currency Support**
   - Automatic currency conversion
   - Region-specific pricing
   - Exchange rate management

3. **Payment Plans**
   - Deposit system (pay 30% now, rest later)
   - Installment options
   - Flexible payment schedules

4. **Advanced Analytics**
   - Price elasticity analysis
   - Revenue optimization recommendations
   - Booking trend predictions

5. **Integration Features**
   - Channel manager integration
   - OTA (Expedia, Booking.com) sync
   - Accounting software integration

---

## Support

For questions or issues with the pricing system:

1. Check this documentation first
2. Review the TypeScript types in `/types/pricing.ts`
3. Examine the calculator logic in `/lib/utils/pricing-calculator.ts`
4. Test with the provided examples

---

## Changelog

**Version 1.0.0** (2025-12-10)
- Initial release
- Complete database schema
- Pricing calculator implementation
- TypeScript type definitions
- Comprehensive documentation
