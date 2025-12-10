/**
 * Professional Travel Agency Pricing Calculator
 *
 * This module provides comprehensive pricing calculation logic for travel packages,
 * including base pricing, seasonal adjustments, group discounts, time-based discounts,
 * promotional codes, and add-ons.
 */

import type {
  PackagePricingTier,
  PackageGroupPricing,
  PackageSeasonalPricing,
  PackageTimeBasedDiscount,
  PackagePromotion,
  PackageAddon,
  PackageDeparturePricing,
  PriceCalculationInput,
  PriceCalculationResult,
  TierType,
} from '@/types/pricing';

/**
 * Calculate the comprehensive price for a package booking
 */
export function calculatePackagePrice(
  input: PriceCalculationInput,
  pricingData: {
    pricing_tiers: PackagePricingTier[];
    group_pricing: PackageGroupPricing[];
    seasonal_pricing: PackageSeasonalPricing[];
    time_based_discounts: PackageTimeBasedDiscount[];
    addons: PackageAddon[];
    departure?: PackageDeparturePricing | null;
    promotions?: PackagePromotion[];
  }
): PriceCalculationResult {
  const bookingDate = input.booking_date ? new Date(input.booking_date) : new Date();
  const travelDate = new Date(input.travel_date);
  const daysBeforeTravel = Math.ceil((travelDate.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24));

  // Calculate total passengers
  const totalPassengers =
    (input.adult_count || 0) +
    (input.child_count || 0) +
    (input.infant_count || 0) +
    (input.senior_count || 0) +
    (input.student_count || 0);

  // Step 1: Calculate base price from pricing tiers
  const basePriceResult = calculateBasePrice(input, pricingData.pricing_tiers, pricingData.departure);

  // Step 2: Apply seasonal pricing adjustments
  const seasonalAdjustment = calculateSeasonalAdjustment(
    travelDate,
    pricingData.seasonal_pricing,
    basePriceResult.tierPrices
  );

  // Step 3: Apply group discounts
  const groupDiscount = calculateGroupDiscount(totalPassengers, pricingData.group_pricing, basePriceResult.tierPrices);

  // Step 4: Apply time-based discounts (early bird / last minute)
  const timeBasedDiscount = calculateTimeBasedDiscount(
    daysBeforeTravel,
    pricingData.time_based_discounts,
    basePriceResult.basePrice + seasonalAdjustment.total - groupDiscount.total
  );

  // Step 5: Apply promotional code
  const promoDiscount = calculatePromoDiscount(
    input.promo_code,
    pricingData.promotions || [],
    basePriceResult.basePrice + seasonalAdjustment.total - groupDiscount.total - timeBasedDiscount.total,
    totalPassengers
  );

  // Step 6: Calculate add-ons
  const addonsTotal = calculateAddons(input.addon_ids || [], input.addon_quantities || {}, pricingData.addons);

  // Calculate final total
  const subtotalAfterDiscounts =
    basePriceResult.basePrice +
    seasonalAdjustment.total -
    groupDiscount.total -
    timeBasedDiscount.total -
    promoDiscount.total;

  const totalPrice = Math.max(0, subtotalAfterDiscounts + addonsTotal.total);

  return {
    total_price: totalPrice,
    base_price: basePriceResult.basePrice,
    currency: 'USD',
    seasonal_adjustment: seasonalAdjustment.total,
    group_discount: groupDiscount.total,
    time_based_discount: timeBasedDiscount.total,
    promo_discount: promoDiscount.total,
    addons_total: addonsTotal.total,
    breakdown: {
      pricing_tiers: basePriceResult.breakdown,
      seasonal_pricing: seasonalAdjustment.details,
      group_pricing: groupDiscount.details,
      time_based_discount: timeBasedDiscount.details,
      promotion: promoDiscount.details,
      addons: addonsTotal.breakdown,
    },
    total_passengers: totalPassengers,
    days_before_travel: daysBeforeTravel,
  };
}

/**
 * Calculate base price from pricing tiers
 */
function calculateBasePrice(
  input: PriceCalculationInput,
  pricingTiers: PackagePricingTier[],
  departure?: PackageDeparturePricing | null
) {
  const tierPrices: Map<TierType, { count: number; unitPrice: number; subtotal: number }> = new Map();
  let basePrice = 0;

  const tierTypes: TierType[] = ['adult', 'child', 'infant', 'senior', 'student'];

  for (const tierType of tierTypes) {
    const count = input[`${tierType}_count` as keyof PriceCalculationInput] as number || 0;

    if (count > 0) {
      // Check if departure has custom pricing
      let unitPrice = 0;

      if (departure?.has_custom_pricing) {
        const customPriceKey = `custom_${tierType}_price` as keyof PackageDeparturePricing;
        unitPrice = (departure[customPriceKey] as number) || 0;
      } else {
        // Use standard pricing tier
        const tier = pricingTiers.find((t) => t.tier_type === tierType && t.is_active);
        unitPrice = tier?.base_price || 0;
      }

      const subtotal = unitPrice * count;
      basePrice += subtotal;

      tierPrices.set(tierType, { count, unitPrice, subtotal });
    }
  }

  const breakdown = Array.from(tierPrices.entries()).map(([tier_type, data]) => ({
    tier_type,
    count: data.count,
    unit_price: data.unitPrice,
    subtotal: data.subtotal,
  }));

  return { basePrice, tierPrices, breakdown };
}

/**
 * Calculate seasonal pricing adjustments
 */
function calculateSeasonalAdjustment(
  travelDate: Date,
  seasonalPricing: PackageSeasonalPricing[],
  tierPrices: Map<TierType, { count: number; unitPrice: number; subtotal: number }>
) {
  // Find applicable seasonal pricing (highest priority)
  const applicableSeason = seasonalPricing
    .filter((season) => {
      if (!season.is_active) return false;
      const startDate = new Date(season.start_date);
      const endDate = new Date(season.end_date);
      return travelDate >= startDate && travelDate <= endDate;
    })
    .sort((a, b) => b.priority - a.priority)[0];

  if (!applicableSeason) {
    return { total: 0, details: undefined };
  }

  let adjustmentAmount = 0;

  // Calculate adjustment based on type
  if (applicableSeason.adjustment_type === 'percentage') {
    // Apply percentage to base price
    const baseTotal = Array.from(tierPrices.values()).reduce((sum, tier) => sum + tier.subtotal, 0);
    adjustmentAmount = (baseTotal * applicableSeason.adjustment_value) / 100;
  } else if (applicableSeason.adjustment_type === 'fixed_amount') {
    adjustmentAmount = applicableSeason.adjustment_value;
  } else if (applicableSeason.adjustment_type === 'override_price') {
    // This would require additional logic to override specific tier prices
    // For now, treat as fixed amount
    adjustmentAmount = applicableSeason.adjustment_value;
  }

  return {
    total: adjustmentAmount,
    details: {
      season_name: applicableSeason.season_name,
      adjustment_type: applicableSeason.adjustment_type,
      adjustment_value: applicableSeason.adjustment_value,
      applied_amount: adjustmentAmount,
    },
  };
}

/**
 * Calculate group discounts based on passenger count
 */
function calculateGroupDiscount(
  totalPassengers: number,
  groupPricing: PackageGroupPricing[],
  tierPrices: Map<TierType, { count: number; unitPrice: number; subtotal: number }>
) {
  // Find applicable group pricing
  const applicableGroupPricing = groupPricing.find(
    (gp) => gp.is_active && totalPassengers >= gp.min_pax && totalPassengers <= gp.max_pax
  );

  if (!applicableGroupPricing) {
    return { total: 0, details: undefined };
  }

  let discountAmount = 0;

  if (applicableGroupPricing.pricing_type === 'discount_percentage') {
    const baseTotal = Array.from(tierPrices.values()).reduce((sum, tier) => sum + tier.subtotal, 0);
    discountAmount = (baseTotal * (applicableGroupPricing.discount_percentage || 0)) / 100;
  } else if (applicableGroupPricing.pricing_type === 'discount_amount') {
    discountAmount = applicableGroupPricing.discount_amount || 0;
  } else if (applicableGroupPricing.pricing_type === 'per_person') {
    // Override per-person pricing
    discountAmount = (applicableGroupPricing.price_per_person || 0) * totalPassengers;
  } else if (applicableGroupPricing.pricing_type === 'per_group') {
    // Flat group rate - calculate discount from base
    const baseTotal = Array.from(tierPrices.values()).reduce((sum, tier) => sum + tier.subtotal, 0);
    const groupRate = applicableGroupPricing.price_per_group || 0;
    discountAmount = baseTotal - groupRate;
  }

  return {
    total: Math.max(0, discountAmount),
    details: {
      min_pax: applicableGroupPricing.min_pax,
      max_pax: applicableGroupPricing.max_pax,
      discount_type: applicableGroupPricing.pricing_type,
      applied_amount: discountAmount,
    },
  };
}

/**
 * Calculate time-based discounts (early bird / last minute)
 */
function calculateTimeBasedDiscount(
  daysBeforeTravel: number,
  timeBasedDiscounts: PackageTimeBasedDiscount[],
  currentPrice: number
) {
  // Find applicable time-based discount
  const applicableDiscount = timeBasedDiscounts.find((discount) => {
    if (!discount.is_active) return false;

    // Check validity period
    if (discount.valid_from && new Date() < new Date(discount.valid_from)) return false;
    if (discount.valid_to && new Date() > new Date(discount.valid_to)) return false;

    // Check days before travel condition
    if (discount.comparison === 'greater_than') {
      return daysBeforeTravel > discount.days_before_travel;
    } else if (discount.comparison === 'less_than') {
      return daysBeforeTravel < discount.days_before_travel;
    } else {
      return daysBeforeTravel === discount.days_before_travel;
    }
  });

  if (!applicableDiscount) {
    return { total: 0, details: undefined };
  }

  let discountAmount = 0;

  if (applicableDiscount.discount_amount_type === 'percentage') {
    discountAmount = (currentPrice * applicableDiscount.discount_value) / 100;
  } else {
    discountAmount = applicableDiscount.discount_value;
  }

  return {
    total: discountAmount,
    details: {
      discount_name: applicableDiscount.discount_name,
      discount_type: applicableDiscount.discount_type,
      days_before_travel: applicableDiscount.days_before_travel,
      applied_amount: discountAmount,
    },
  };
}

/**
 * Calculate promotional discount
 */
function calculatePromoDiscount(
  promoCode: string | undefined,
  promotions: PackagePromotion[],
  currentPrice: number,
  totalPassengers: number
) {
  if (!promoCode) {
    return { total: 0, details: undefined };
  }

  const promo = promotions.find(
    (p) =>
      p.promotion_code.toLowerCase() === promoCode.toLowerCase() &&
      p.is_active &&
      new Date() >= new Date(p.valid_from) &&
      new Date() <= new Date(p.valid_to) &&
      (!p.max_uses || p.current_uses < p.max_uses) &&
      (!p.min_purchase_amount || currentPrice >= p.min_purchase_amount) &&
      (!p.min_pax || totalPassengers >= p.min_pax)
  );

  if (!promo) {
    return { total: 0, details: undefined };
  }

  let discountAmount = 0;

  if (promo.discount_type === 'percentage') {
    discountAmount = (currentPrice * (promo.discount_value || 0)) / 100;
  } else if (promo.discount_type === 'fixed_amount') {
    discountAmount = promo.discount_value || 0;
  } else if (promo.discount_type === 'buy_x_get_y') {
    // Buy X Get Y logic would need package-level implementation
    // For now, apply as percentage discount
    discountAmount = 0;
  }

  return {
    total: discountAmount,
    details: {
      promotion_code: promo.promotion_code,
      promotion_name: promo.promotion_name,
      applied_amount: discountAmount,
    },
  };
}

/**
 * Calculate add-ons total
 */
function calculateAddons(
  addonIds: string[],
  addonQuantities: Record<string, number>,
  addons: PackageAddon[]
) {
  let total = 0;
  const breakdown: Array<{
    addon_id: string;
    addon_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }> = [];

  for (const addonId of addonIds) {
    const addon = addons.find((a) => a.id === addonId && a.is_active);
    if (!addon) continue;

    const quantity = addonQuantities[addonId] || 1;
    const subtotal = addon.price * quantity;
    total += subtotal;

    breakdown.push({
      addon_id: addon.id,
      addon_name: addon.addon_name,
      quantity,
      unit_price: addon.price,
      subtotal,
    });
  }

  return { total, breakdown };
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(
  sellingPrice: number,
  costPrice: number
): { profit: number; marginPercentage: number } {
  const profit = sellingPrice - costPrice;
  const marginPercentage = costPrice > 0 ? (profit / costPrice) * 100 : 0;

  return { profit, marginPercentage };
}

/**
 * Validate minimum group size requirements
 */
export function validateGroupSize(
  totalPassengers: number,
  minGroupSize: number,
  maxGroupSize: number
): { valid: boolean; message?: string } {
  if (totalPassengers < minGroupSize) {
    return {
      valid: false,
      message: `Minimum group size is ${minGroupSize} passengers. You have ${totalPassengers}.`,
    };
  }

  if (totalPassengers > maxGroupSize) {
    return {
      valid: false,
      message: `Maximum group size is ${maxGroupSize} passengers. You have ${totalPassengers}.`,
    };
  }

  return { valid: true };
}

/**
 * Check departure availability
 */
export function checkDepartureAvailability(
  departure: PackageDeparturePricing,
  requestedSlots: number
): { available: boolean; message?: string; availableSlots: number } {
  const availableSlots = departure.available_slots - departure.booked_slots;

  if (departure.status === 'sold_out' || availableSlots === 0) {
    return {
      available: false,
      message: 'This departure is sold out.',
      availableSlots: 0,
    };
  }

  if (departure.status === 'cancelled') {
    return {
      available: false,
      message: 'This departure has been cancelled.',
      availableSlots: 0,
    };
  }

  if (requestedSlots > availableSlots) {
    return {
      available: false,
      message: `Only ${availableSlots} slots available for this departure. You requested ${requestedSlots}.`,
      availableSlots,
    };
  }

  return {
    available: true,
    availableSlots,
  };
}
