/**
 * Professional Travel Agency Pricing System Types
 *
 * This module defines the comprehensive pricing structure for travel packages,
 * supporting multiple package variants, age-based pricing, seasonal rates,
 * group discounts, add-ons, and promotional offers.
 */

export type PricingType = 'per_person' | 'per_group' | 'discount_percentage' | 'discount_amount' | 'per_unit';
export type TierType = 'adult' | 'child' | 'infant' | 'senior' | 'student';
export type AdjustmentType = 'percentage' | 'fixed_amount' | 'override_price';
export type DiscountType = 'early_bird' | 'last_minute';
export type ComparisonType = 'greater_than' | 'less_than' | 'equal_to';
export type DepartureStatus = 'available' | 'limited' | 'sold_out' | 'cancelled';
export type AddonCategory = 'Transportation' | 'Activities' | 'Meals' | 'Insurance' | 'Equipment' | 'Other';

// =====================================================
// Package Variants
// =====================================================

/**
 * Package variant (e.g., Standard, Premium, Luxury)
 * Multiple packages can exist for the same experience with different service levels
 * ENHANCED: Now includes use_custom_tiers flag for tier-ID-based selection
 */
export interface ExperiencePackage {
  id: string;
  experience_id: string;

  // Package details
  package_name: string; // e.g., "Standard", "Premium", "Luxury"
  package_code?: string; // e.g., "STD", "PREM", "LUX"
  description?: string;

  // Group size constraints
  min_group_size: number;
  max_group_size: number;

  // Availability
  available_from?: string | null; // ISO date
  available_to?: string | null; // ISO date

  // Package-specific inclusions/exclusions
  inclusions?: string[];
  exclusions?: string[];

  // NEW: Custom tier selection mode
  use_custom_tiers?: boolean; // If true, use tier-ID selection; if false, use generic counts

  // Display
  display_order: number;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Pricing Tiers (Age-based)
// =====================================================

/**
 * Age-based pricing tier (adult, child, infant, senior, student)
 * ENHANCED: Now supports custom tier selection with unique labels
 */
export interface PackagePricingTier {
  id: string;
  package_id: string;

  // Tier details
  tier_type: TierType;
  tier_label?: string; // e.g., "Adult (18-64 years)" or "Child (Share twin bedroom with 1 Adult)"
  tier_code?: string; // Unique code for this tier (e.g., "CHILD_TWIN_SHARE")
  description?: string; // Additional description for the tier

  // Age restrictions (optional)
  min_age?: number;
  max_age?: number;

  // Pricing
  base_price: number;
  selling_price?: number; // Customer-facing price (may include markup)
  currency: string;
  cost_price?: number; // For margin calculation

  // Supplier currency fields
  supplier_currency?: string; // ISO currency code (e.g., EUR, JPY, CNY)
  supplier_cost?: number; // Cost in supplier's currency for this specific tier
  supplier_cost_adult?: number; // Legacy: Cost in supplier's currency
  supplier_cost_child?: number;
  supplier_cost_infant?: number;
  supplier_cost_senior?: number;
  exchange_rate?: number; // Conversion rate: 1 supplier_currency = X USD

  // Markup fields
  markup_type?: 'percentage' | 'fixed' | 'none';
  markup_value?: number;

  // NEW: Custom tier selection support
  display_order?: number; // Order in which tiers should be displayed
  requires_adult_accompaniment?: boolean; // Whether this tier requires at least one adult
  max_per_booking?: number; // Maximum number of this tier allowed per booking
  booking_notes?: string; // Additional requirements or notes

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Group Size Pricing
// =====================================================

/**
 * Volume discounts based on group size
 */
export interface PackageGroupPricing {
  id: string;
  package_id: string;

  // Group size range
  min_pax: number;
  max_pax: number;

  // Pricing strategy
  pricing_type: PricingType;

  // Values based on pricing_type
  price_per_person?: number; // For per_person type
  price_per_group?: number; // For per_group type (flat rate)
  discount_percentage?: number; // For discount_percentage type
  discount_amount?: number; // For discount_amount type

  // Apply to specific tiers or all
  applies_to_tier_type?: TierType | null; // null = all tiers

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Seasonal Pricing
// =====================================================

/**
 * Seasonal pricing adjustments (peak season, off-peak, holidays)
 */
export interface PackageSeasonalPricing {
  id: string;
  package_id: string;

  // Season details
  season_name: string; // e.g., "Peak Season", "Holiday Season"
  start_date: string; // ISO date
  end_date: string; // ISO date

  // Pricing adjustment
  adjustment_type: AdjustmentType;
  adjustment_value: number;

  // Apply to specific tiers or all
  applies_to_tier_type?: TierType | null;

  // Priority (higher = more important if overlapping)
  priority: number;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Time-based Discounts
// =====================================================

/**
 * Early bird and last-minute booking discounts
 */
export interface PackageTimeBasedDiscount {
  id: string;
  package_id: string;

  // Discount details
  discount_name: string;
  discount_type: DiscountType;

  // Time threshold
  days_before_travel: number;
  comparison: ComparisonType;

  // Discount value
  discount_amount_type: 'percentage' | 'fixed_amount';
  discount_value: number;

  // Validity period
  valid_from?: string | null; // ISO date
  valid_to?: string | null; // ISO date

  // Apply to specific tiers or all
  applies_to_tier_type?: TierType | null;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Add-ons / Optional Extras
// =====================================================

/**
 * Optional add-ons that can be purchased with packages
 */
export interface PackageAddon {
  id: string;
  package_id: string;

  // Add-on details
  addon_name: string;
  addon_code?: string;
  description?: string;

  // Pricing
  pricing_type: PricingType;
  price: number;
  currency: string;

  // Constraints
  min_quantity: number;
  max_quantity?: number;
  is_required: boolean;

  // Category
  category?: AddonCategory;

  // Display
  display_order: number;
  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Promotions
// =====================================================

/**
 * Promotional codes and special offers
 */
export interface PackagePromotion {
  id: string;

  // Promotion details
  promotion_code: string;
  promotion_name: string;
  description?: string;

  // Discount
  discount_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y';
  discount_value?: number;

  // Buy X Get Y fields
  buy_quantity?: number;
  get_quantity?: number;

  // Applicable packages
  package_ids?: string[] | null; // null = all packages

  // Validity
  valid_from: string; // ISO timestamp
  valid_to: string; // ISO timestamp

  // Usage limits
  max_uses?: number | null; // null = unlimited
  max_uses_per_customer: number;
  current_uses: number;

  // Requirements
  min_purchase_amount?: number;
  min_pax?: number;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Departure-specific Pricing
// =====================================================

/**
 * Specific departure dates with custom pricing and availability
 */
export interface PackageDeparturePricing {
  id: string;
  package_id: string;

  // Departure details
  departure_date: string; // ISO date
  departure_time?: string; // HH:MM format

  // Availability
  available_slots: number;
  booked_slots: number;

  // Custom pricing
  has_custom_pricing: boolean;
  custom_adult_price?: number;
  custom_child_price?: number;
  custom_infant_price?: number;
  custom_senior_price?: number;

  // Status
  status: DepartureStatus;

  // Additional info
  guide_name?: string;
  notes?: string;

  is_active: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Price Calculation Types
// =====================================================

/**
 * Tier selection for custom tier packages
 * Used when use_custom_tiers = true
 */
export interface TierSelection {
  tier_id: string; // References package_pricing_tiers.id
  tier_label: string; // For display/logging purposes
  quantity: number; // Number of passengers for this specific tier
}

/**
 * Input for calculating package price
 * ENHANCED: Now supports both tier-ID selection (custom) and generic counts (legacy)
 */
export interface PriceCalculationInput {
  package_id: string;
  travel_date: string; // ISO date
  booking_date?: string; // ISO date, defaults to today

  // NEW: Tier-based selection (for custom tier packages with use_custom_tiers = true)
  selected_tiers?: TierSelection[];

  // LEGACY: Passenger counts by type (for standard packages with use_custom_tiers = false)
  // These are still supported for backward compatibility
  adult_count?: number;
  child_count?: number;
  infant_count?: number;
  senior_count?: number;
  student_count?: number;

  // Optional
  promo_code?: string;
  addon_ids?: string[]; // Array of addon IDs
  addon_quantities?: Record<string, number>; // Map of addon_id to quantity
}

/**
 * Detailed price breakdown result
 */
export interface PriceCalculationResult {
  total_price: number;
  base_price: number;
  currency: string;

  // Adjustments
  seasonal_adjustment: number;
  group_discount: number;
  time_based_discount: number;
  promo_discount: number;
  addons_total: number;

  // Detailed breakdown
  breakdown: {
    pricing_tiers: Array<{
      tier_id: string; // NEW: Tier ID for reference
      tier_type: TierType;
      tier_label: string; // NEW: Full custom label (e.g., "Child (Share twin bedroom)")
      count: number;
      unit_price: number;
      subtotal: number;
    }>;

    seasonal_pricing?: {
      season_name: string;
      adjustment_type: AdjustmentType;
      adjustment_value: number;
      applied_amount: number;
    };

    group_pricing?: {
      min_pax: number;
      max_pax: number;
      discount_type: string;
      applied_amount: number;
    };

    time_based_discount?: {
      discount_name: string;
      discount_type: DiscountType;
      days_before_travel: number;
      applied_amount: number;
    };

    promotion?: {
      promotion_code: string;
      promotion_name: string;
      applied_amount: number;
    };

    addons?: Array<{
      addon_id: string;
      addon_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
  };

  // Metadata
  total_passengers: number;
  days_before_travel: number;
}

// =====================================================
// Complete Package with All Pricing
// =====================================================

/**
 * Complete package with all associated pricing information
 */
export interface PackageWithPricing extends ExperiencePackage {
  pricing_tiers: PackagePricingTier[];
  group_pricing: PackageGroupPricing[];
  seasonal_pricing: PackageSeasonalPricing[];
  time_based_discounts: PackageTimeBasedDiscount[];
  addons: PackageAddon[];
  departures?: PackageDeparturePricing[];
}

/**
 * Experience with all package variants
 */
export interface ExperienceWithPackages {
  experience_id: string;
  experience_title: string;
  packages: PackageWithPricing[];
}

// =====================================================
// Form Types for Admin UI
// =====================================================

/**
 * Form state for creating/editing a package
 */
export interface PackageFormData {
  package_name: string;
  package_code?: string;
  description?: string;
  min_group_size: number;
  max_group_size: number | null;
  available_from?: string;
  available_to?: string;
  inclusions: string[];
  exclusions: string[];
  display_order: number;

  // Pricing tiers
  adult_price?: number;
  child_price?: number;
  infant_price?: number;
  senior_price?: number;
  student_price?: number;
}

/**
 * Form state for creating/editing an add-on
 */
export interface AddonFormData {
  addon_name: string;
  addon_code?: string;
  description?: string;
  pricing_type: PricingType;
  price: number;
  min_quantity: number;
  max_quantity?: number;
  is_required: boolean;
  category?: AddonCategory;
  display_order: number;
}

/**
 * Form state for creating/editing a promotion
 */
export interface PromotionFormData {
  promotion_code: string;
  promotion_name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y';
  discount_value?: number;
  buy_quantity?: number;
  get_quantity?: number;
  package_ids?: string[];
  valid_from: string;
  valid_to: string;
  max_uses?: number;
  max_uses_per_customer: number;
  min_purchase_amount?: number;
  min_pax?: number;
}
