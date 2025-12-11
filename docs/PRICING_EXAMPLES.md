# Real-World Pricing Examples

This document provides concrete examples of how the pricing system works in real travel agency scenarios.

---

## Example 1: Simple Family Booking

### Scenario
**Experience**: Bali Volcano Sunrise Trek
**Package**: Standard Package
**Travel Date**: July 15, 2025
**Booking Date**: May 1, 2025 (75 days in advance)
**Passengers**: 2 Adults, 1 Child (ages 35, 32, 8)

### Package Setup
```typescript
// Standard Package Pricing
Adult Price: $85
Child Price: $60
Min Group: 2 pax
Max Group: 12 pax
```

### Calculation
```
Step 1: Base Price
  2 Adults × $85 = $170
  1 Child × $60  = $60
  Base Total     = $230

Step 2: Seasonal Adjustment
  No seasonal pricing configured
  Adjustment = $0

Step 3: Group Discount
  Total passengers = 3
  No group discount (min 5 required)
  Discount = $0

Step 4: Early Bird Discount
  Booked 75 days in advance
  "Early Bird 60+" = 15% off
  Discount = $230 × 15% = $34.50

Step 5: Promo Code
  No promo code entered
  Discount = $0

Step 6: Add-ons
  No add-ons selected
  Add-ons = $0

FINAL TOTAL: $195.50

Savings: $34.50 (15% off)
```

### Booking Summary
```
┌─────────────────────────────────────────────────┐
│  Bali Volcano Sunrise Trek - Standard Package  │
├─────────────────────────────────────────────────┤
│  Travel Date: July 15, 2025                     │
│  Passengers: 2 Adults, 1 Child                  │
│                                                  │
│  Pricing Breakdown:                              │
│  ─────────────────────────────────────────────  │
│  2 Adults @ $85 each           $170.00          │
│  1 Child @ $60 each            $60.00           │
│  Subtotal                      $230.00          │
│                                                  │
│  Early Bird Discount (15%)     -$34.50  ✅      │
│                                                  │
│  TOTAL DUE                     $195.50          │
│                                                  │
│  💰 You saved $34.50!                           │
└─────────────────────────────────────────────────┘
```

---

## Example 2: Large Group with Peak Season

### Scenario
**Experience**: Tokyo Food & Culture Tour
**Package**: Premium Package
**Travel Date**: December 25, 2025 (Christmas)
**Booking Date**: December 1, 2025
**Passengers**: 12 Adults
**Promo Code**: WINTER10

### Package Setup
```typescript
// Premium Package Pricing
Adult Price: $100
Child Price: $70
Min Group: 2 pax
Max Group: 20 pax

// Seasonal Pricing
Season: Christmas Week (Dec 20-27)
Adjustment: +25% (peak season)

// Group Discount
10-15 pax: 15% off
```

### Calculation
```
Step 1: Base Price
  12 Adults × $100 = $1,200
  Base Total       = $1,200

Step 2: Seasonal Adjustment (Peak Season)
  Christmas Week +25%
  Adjustment = $1,200 × 25% = $300
  Adjusted Total = $1,500

Step 3: Group Discount (10-15 pax)
  12 passengers qualifies for group rate
  15% off adjusted price
  Discount = $1,500 × 15% = $225
  After Discount = $1,275

Step 4: Early Bird Discount
  Booked only 24 days in advance
  Does not qualify for early bird
  Discount = $0

Step 5: Promo Code (WINTER10)
  10% off current price
  Discount = $1,275 × 10% = $127.50
  After Promo = $1,147.50

Step 6: Add-ons
  No add-ons
  Add-ons = $0

FINAL TOTAL: $1,147.50

Original: $1,200
With Peak Season: $1,500
Your Price: $1,147.50
Net Savings: -$352.50 (discount exceeded peak season charge)
```

### Booking Summary
```
┌─────────────────────────────────────────────────┐
│  Tokyo Food Tour - Premium Package             │
├─────────────────────────────────────────────────┤
│  Travel Date: December 25, 2025 🎄             │
│  Passengers: 12 Adults                          │
│                                                  │
│  Pricing Breakdown:                              │
│  ─────────────────────────────────────────────  │
│  12 Adults @ $100 each         $1,200.00        │
│  Subtotal                      $1,200.00        │
│                                                  │
│  Peak Season (+25%)            +$300.00  ⚠️     │
│  Group Discount (15%)          -$225.00  ✅     │
│  Promo WINTER10 (10%)          -$127.50  ✅     │
│                                                  │
│  TOTAL DUE                     $1,147.50        │
│                                                  │
│  Per person: $95.63                             │
└─────────────────────────────────────────────────┘
```

---

## Example 3: Luxury Package with Add-ons

### Scenario
**Experience**: Santorini Sunset Sailing
**Package**: Luxury Package
**Travel Date**: June 10, 2025
**Booking Date**: February 1, 2025 (129 days in advance)
**Passengers**: 2 Adults
**Add-ons**:
- Private Transfer: $120 (per group)
- Professional Photography: $50 per person
- Premium Wine Pairing: $40 per person

### Package Setup
```typescript
// Luxury Package Pricing
Adult Price: $200
Child Price: $140
Min Group: 2 pax
Max Group: 8 pax

// Early Bird Discounts
90+ days: 20% off
60-89 days: 15% off
30-59 days: 10% off

// Add-ons
Private Transfer: $120 per group
Pro Photography: $50 per person
Wine Pairing: $40 per person
```

### Calculation
```
Step 1: Base Price
  2 Adults × $200 = $400
  Base Total      = $400

Step 2: Seasonal Adjustment
  No seasonal pricing for June
  Adjustment = $0

Step 3: Group Discount
  Only 2 passengers, no group discount
  Discount = $0

Step 4: Early Bird Discount
  Booked 129 days in advance
  Qualifies for "90+ days" = 20% off
  Discount = $400 × 20% = $80
  After Discount = $320

Step 5: Promo Code
  No promo code
  Discount = $0

Step 6: Add-ons
  Private Transfer: $120 × 1 group = $120
  Photography: $50 × 2 people = $100
  Wine Pairing: $40 × 2 people = $80
  Add-ons Total = $300

FINAL TOTAL: $620

Package: $320 (after 20% early bird)
Add-ons: $300
Savings: $80
```

### Booking Summary
```
┌─────────────────────────────────────────────────┐
│  Santorini Sunset Sailing - Luxury Package     │
├─────────────────────────────────────────────────┤
│  Travel Date: June 10, 2025                     │
│  Passengers: 2 Adults                           │
│                                                  │
│  Base Package:                                   │
│  ─────────────────────────────────────────────  │
│  2 Adults @ $200 each          $400.00          │
│  Early Bird 90+ Days (20%)     -$80.00  ✅      │
│  Package Subtotal              $320.00          │
│                                                  │
│  Add-ons & Extras:                               │
│  ─────────────────────────────────────────────  │
│  Private Transfer              $120.00          │
│  Pro Photography (2 pax)       $100.00          │
│  Wine Pairing (2 pax)          $80.00           │
│  Add-ons Subtotal              $300.00          │
│                                                  │
│  TOTAL DUE                     $620.00          │
│                                                  │
│  💎 Luxury Experience                           │
│  💰 Early bird savings: $80                     │
└─────────────────────────────────────────────────┘
```

---

## Example 4: Multi-Package Comparison

### Scenario
**Experience**: Kyoto Temples & Gardens Full Day Tour
**Packages**: Standard, Premium, Luxury
**Travel Date**: April 5, 2025 (Cherry Blossom Season)
**Passengers**: 2 Adults, 2 Children

### Standard Package
```
Base Pricing:
  Adult: $80
  Child: $55

Calculation:
  2 Adults × $80 = $160
  2 Children × $55 = $110
  Base = $270

Cherry Blossom Season (+15%):
  $270 × 15% = $40.50
  Subtotal = $310.50

Group Discount (4 pax, 5% off):
  $310.50 × 5% = $15.53
  Total = $294.97

Inclusions:
  ✓ Shared transport
  ✓ English-speaking guide
  ✓ Temple entrance fees
  ✓ Simple lunch
```

### Premium Package
```
Base Pricing:
  Adult: $120
  Child: $85

Calculation:
  2 Adults × $120 = $240
  2 Children × $85 = $170
  Base = $410

Cherry Blossom Season (+15%):
  $410 × 15% = $61.50
  Subtotal = $471.50

Group Discount (4 pax, 5% off):
  $471.50 × 5% = $23.58
  Total = $447.92

Inclusions:
  ✓ Private transport
  ✓ Expert guide with cultural insights
  ✓ Temple entrance fees
  ✓ Traditional kaiseki lunch
  ✓ Tea ceremony experience
  ✓ Souvenir photos
```

### Luxury Package
```
Base Pricing:
  Adult: $200
  Child: $140

Calculation:
  2 Adults × $200 = $400
  2 Children × $140 = $280
  Base = $680

Cherry Blossom Season (+15%):
  $680 × 15% = $102
  Subtotal = $782

Group Discount (4 pax, 5% off):
  $782 × 5% = $39.10
  Total = $742.90

Inclusions:
  ✓ Luxury private vehicle
  ✓ Personal expert guide
  ✓ VIP temple access (before opening)
  ✓ Multi-course kaiseki at renowned restaurant
  ✓ Private tea ceremony with master
  ✓ Professional photographer
  ✓ Kimono rental for family
  ✓ Cherry blossom viewing at secret location
```

### Side-by-Side Comparison
```
┌───────────────┬──────────┬──────────┬──────────┐
│   Feature     │ Standard │ Premium  │  Luxury  │
├───────────────┼──────────┼──────────┼──────────┤
│ Base Price    │  $270    │  $410    │  $680    │
│ Seasonal +15% │  +$41    │  +$62    │  +$102   │
│ Group 5% Off  │  -$16    │  -$24    │  -$39    │
│ TOTAL         │  $295    │  $448    │  $743    │
├───────────────┼──────────┼──────────┼──────────┤
│ Transport     │ Shared   │ Private  │ Luxury   │
│ Guide         │ English  │ Expert   │ Personal │
│ Lunch         │ Simple   │ Kaiseki  │ Premium  │
│ Tea Ceremony  │ No       │ Yes      │ Private  │
│ Photos        │ No       │ Basic    │ Pro      │
│ Special Access│ No       │ No       │ VIP      │
│ Kimono        │ No       │ No       │ Yes      │
└───────────────┴──────────┴──────────┴──────────┘

Recommendation:
  Budget-conscious: Standard ($295)
  Best Value: Premium ($448) - Most popular!
  Ultimate Experience: Luxury ($743)
```

---

## Example 5: Last-Minute Booking Deal

### Scenario
**Experience**: Phi Phi Islands Day Trip
**Package**: Standard Package
**Travel Date**: June 8, 2025
**Booking Date**: June 3, 2025 (5 days before travel)
**Passengers**: 2 Adults

### Package Setup
```typescript
// Standard Package
Adult Price: $95
Child Price: $67

// Last Minute Discount
0-7 days before: $50 off per booking
```

### Calculation
```
Step 1: Base Price
  2 Adults × $95 = $190
  Base Total     = $190

Step 2: Seasonal Adjustment
  Off-peak season (June)
  No adjustment = $0

Step 3: Group Discount
  Only 2 passengers
  No discount = $0

Step 4: Last Minute Discount
  Booked 5 days before travel
  Qualifies for "0-7 days" deal
  Fixed discount = $50
  After Discount = $140

Step 5: Promo Code
  No promo code
  Discount = $0

Step 6: Add-ons
  No add-ons
  Add-ons = $0

FINAL TOTAL: $140

Regular Price: $190
Last Minute Deal: $140
Savings: $50 (26% off)
```

### Booking Summary
```
┌─────────────────────────────────────────────────┐
│  🔥 LAST MINUTE DEAL 🔥                         │
├─────────────────────────────────────────────────┤
│  Phi Phi Islands Day Trip - Standard Package   │
│                                                  │
│  Travel Date: June 8, 2025 (5 DAYS AWAY!)      │
│  Passengers: 2 Adults                           │
│                                                  │
│  Pricing Breakdown:                              │
│  ─────────────────────────────────────────────  │
│  2 Adults @ $95 each           $190.00          │
│  Subtotal                      $190.00          │
│                                                  │
│  Last Minute Deal (5 days)     -$50.00  🔥      │
│                                                  │
│  TOTAL DUE                     $140.00          │
│                                                  │
│  Per person: $70                                │
│  💰 You saved $50!                              │
│                                                  │
│  ⚡ Only 8 spots left - Book now!               │
└─────────────────────────────────────────────────┘
```

---

## Example 6: Corporate Group with Custom Pricing

### Scenario
**Experience**: Private Bali Team Building Retreat
**Package**: Custom Corporate Package
**Travel Date**: September 15, 2025
**Booking Date**: June 1, 2025 (106 days in advance)
**Passengers**: 25 Adults

### Package Setup
```typescript
// Custom Corporate Package
Adult Price: $180
Min Group: 15 pax
Max Group: 30 pax

// Group Pricing (Custom for 20+ pax)
20-30 pax: $150 per person (flat rate)

// Early Bird
90+ days: Additional $10 off per person
```

### Calculation
```
Step 1: Base Price
  25 Adults × $180 = $4,500
  Base Total       = $4,500

Step 2: Seasonal Adjustment
  No seasonal pricing
  Adjustment = $0

Step 3: Group Pricing (20-30 pax)
  Flat rate pricing applies
  New price = $150 × 25 = $3,750
  Discount = $750

Step 4: Early Bird Discount
  Booked 106 days in advance
  Qualifies for 90+ days
  Additional $10 per person
  Discount = $10 × 25 = $250
  After Discount = $3,500

Step 5: Promo Code
  Corporate client, no promo needed
  Discount = $0

Step 6: Add-ons (Included in Package)
  Private resort venue: Included
  Team activities: Included
  Lunch & refreshments: Included
  Professional facilitator: Included
  Add-ons = $0

FINAL TOTAL: $3,500

Per Person: $140
Regular Price: $180 per person ($4,500 total)
Corporate Rate: $140 per person ($3,500 total)
Total Savings: $1,000
```

### Booking Summary
```
┌─────────────────────────────────────────────────┐
│  🏢 CORPORATE TEAM BUILDING PACKAGE             │
├─────────────────────────────────────────────────┤
│  Private Bali Team Retreat                      │
│  Travel Date: September 15, 2025                │
│  Group Size: 25 Adults                          │
│                                                  │
│  Pricing Breakdown:                              │
│  ─────────────────────────────────────────────  │
│  25 Adults @ $180 each         $4,500.00        │
│  Standard Subtotal             $4,500.00        │
│                                                  │
│  Corporate Group Rate (20+)    -$750.00  ✅     │
│  Early Bird 90+ Days           -$250.00  ✅     │
│                                                  │
│  TOTAL DUE                     $3,500.00        │
│                                                  │
│  Per person: $140 (was $180)                    │
│  Total savings: $1,000                          │
│                                                  │
│  Package Includes:                               │
│  ✓ Private resort venue (full day)             │
│  ✓ Team building activities                    │
│  ✓ Gourmet lunch & refreshments                │
│  ✓ Professional facilitator                    │
│  ✓ Transport for all participants              │
│  ✓ Welcome gifts & certificates                │
│                                                  │
│  📧 Invoice sent to: accounting@company.com     │
│  💼 Payment terms: Net 30                       │
└─────────────────────────────────────────────────┘
```

---

## Key Takeaways

### Discount Stacking Rules
1. **Seasonal pricing** is applied first (can increase or decrease price)
2. **Group discounts** are calculated on the seasonally-adjusted price
3. **Time-based discounts** (early bird/last minute) apply after group discounts
4. **Promo codes** are applied last (before add-ons)
5. **Add-ons** are added to the final discounted price

### Best Practices for Tour Operators

**Standard Package**:
- Target: Budget-conscious travelers
- Margin: 25-35%
- Focus: Essential inclusions, good value

**Premium Package**:
- Target: Mid-market travelers
- Margin: 35-45%
- Focus: Enhanced experience, convenience

**Luxury Package**:
- Target: High-end travelers
- Margin: 45-60%
- Focus: Exclusive access, personalization

**Group Discounts**:
- Start small (5% for 2-4 pax)
- Increase gradually (up to 20% for 15+ pax)
- Use flat rates for large corporate groups

**Seasonal Pricing**:
- Peak season: +20% to +50%
- Shoulder season: +10% to +20%
- Off-peak: -10% to -20%

**Early Bird Strategy**:
- 90+ days: 15-20% off (lock in bookings)
- 60-89 days: 10-15% off
- 30-59 days: 5-10% off

**Last Minute**:
- 7-14 days: $20-$50 off
- 0-6 days: $50-$100 off (fill empty slots)

---

## Testing Your Pricing

Use these test scenarios to validate your setup:

1. ✅ Basic booking with no discounts
2. ✅ Peak season with group discount
3. ✅ Early bird booking with promo code
4. ✅ Last minute deal
5. ✅ Multiple add-ons
6. ✅ Corporate group rate
7. ✅ Mixed passenger types (adults, children, seniors)
8. ✅ Edge cases (solo traveler, max group size)

---

This completes the pricing examples! You now have real-world scenarios to reference when setting up your packages.
