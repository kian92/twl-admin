import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { calculatePackagePrice } from '@/lib/utils/pricing-calculator';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const input = await request.json();

    if (!input.package_id) {
      return NextResponse.json({ error: 'package_id is required' }, { status: 400 });
    }

    // Fetch package
    const { data: packageData, error: pkgError } = await supabase
      .from('experience_packages')
      .select('*')
      .eq('id', input.package_id)
      .single();

    if (pkgError) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Fetch pricing tiers
    const { data: pricingTiers } = await supabase
      .from('package_pricing_tiers')
      .select('*')
      .eq('package_id', input.package_id)
      .eq('is_active', true);

    // Fetch group pricing
    const { data: groupPricing } = await supabase
      .from('package_group_pricing')
      .select('*')
      .eq('package_id', input.package_id)
      .eq('is_active', true);

    // Fetch seasonal pricing
    const { data: seasonalPricing } = await supabase
      .from('package_seasonal_pricing')
      .select('*')
      .eq('package_id', input.package_id)
      .eq('is_active', true);

    // Fetch time-based discounts
    const { data: timeBasedDiscounts } = await supabase
      .from('package_time_based_discounts')
      .select('*')
      .eq('package_id', input.package_id)
      .eq('is_active', true);

    // Fetch add-ons
    const { data: addons } = await supabase
      .from('package_addons')
      .select('*')
      .eq('package_id', input.package_id)
      .eq('is_active', true);

    // Fetch promotions
    const { data: promotions } = await supabase
      .from('package_promotions')
      .select('*')
      .eq('is_active', true);

    // Check if travel date is blocked
    if (input.travel_date) {
      const { data: blockedDates } = await supabase
        .from('package_blocked_dates')
        .select('start_date, end_date, reason')
        .eq('package_id', input.package_id);

      if (blockedDates && blockedDates.length > 0) {
        const travelDate = new Date(input.travel_date);

        for (const blockedRange of blockedDates) {
          const startDate = new Date(blockedRange.start_date);
          const endDate = new Date(blockedRange.end_date);

          if (travelDate >= startDate && travelDate <= endDate) {
            return NextResponse.json(
              {
                error: 'This date is not available for booking',
                reason: blockedRange.reason,
                blocked: true
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // Check for departure-specific pricing
    let departure = null;
    if (input.travel_date) {
      const { data: departureData } = await supabase
        .from('package_departure_pricing')
        .select('*')
        .eq('package_id', input.package_id)
        .eq('departure_date', input.travel_date)
        .eq('is_active', true)
        .single();

      departure = departureData;
    }

    // Calculate price
    const result = calculatePackagePrice(input, {
      pricing_tiers: pricingTiers || [],
      group_pricing: groupPricing || [],
      seasonal_pricing: seasonalPricing || [],
      time_based_discounts: timeBasedDiscounts || [],
      addons: addons || [],
      departure: departure,
      promotions: promotions || [],
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error('Price calculation error:', err);
    return NextResponse.json(
      { error: 'Failed to calculate price' },
      { status: 500 }
    );
  }
}
