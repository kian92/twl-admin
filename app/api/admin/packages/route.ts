import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch all packages for an experience
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const experienceId = searchParams.get('experience_id');

    if (!experienceId) {
      return NextResponse.json({ error: 'experience_id is required' }, { status: 400 });
    }

    // Fetch packages with all related pricing data
    const { data: packages, error: packagesError } = await supabase
      .from('experience_packages')
      .select(`
        *,
        pricing_tiers:package_pricing_tiers(*),
        group_pricing:package_group_pricing(*),
        seasonal_pricing:package_seasonal_pricing(*),
        time_based_discounts:package_time_based_discounts(*),
        addons:package_addons(*)
      `)
      .eq('experience_id', experienceId)
      .order('display_order', { ascending: true });

    if (packagesError) {
      return NextResponse.json({ error: packagesError.message }, { status: 500 });
    }

    return NextResponse.json(packages || [], { status: 200 });
  } catch (err) {
    console.error('Failed to fetch packages:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST - Create a new package
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate that the experience exists
    const { data: experience, error: experienceError } = await supabase
      .from('experiences')
      .select('id')
      .eq('id', body.experience_id)
      .single();

    if (experienceError || !experience) {
      return NextResponse.json(
        { error: `Experience with id ${body.experience_id} does not exist` },
        { status: 400 }
      );
    }

    // Create package (including new use_custom_tiers flag)
    const { data: newPackage, error: packageError } = await supabase
      .from('experience_packages')
      .insert({
        experience_id: body.experience_id,
        package_name: body.package_name,
        package_code: body.package_code,
        description: body.description,
        tour_type: body.tour_type || 'group',
        min_group_size: body.min_group_size ?? 1,
        max_group_size: body.max_group_size ?? null,
        available_from: body.available_from || null,
        available_to: body.available_to || null,
        inclusions: body.inclusions || [],
        exclusions: body.exclusions || [],
        display_order: body.display_order || 0,
        is_active: body.is_active !== false,
        requires_full_payment: body.requires_full_payment || false,
        use_custom_tiers: body.use_custom_tiers || false, // NEW: Set custom tiers flag
      })
      .select()
      .single();

    if (packageError) {
      return NextResponse.json({ error: packageError.message }, { status: 500 });
    }

    // Create pricing tiers
    const pricingTiers = [];

    // Get markup settings from request body
    const markupType = body.markup_type || 'none';
    const markupValue = body.markup_value || 0;

    // Check if using custom pricing tiers
    if (body.use_custom_tiers && body.custom_pricing_tiers && Array.isArray(body.custom_pricing_tiers)) {
      // Use custom pricing tiers
      body.custom_pricing_tiers.forEach((tier: any) => {
        pricingTiers.push({
          package_id: newPackage.id,
          tier_type: tier.tier_type,
          tier_label: tier.tier_label,
          min_age: tier.min_age || null,
          max_age: tier.max_age || null,
          base_price: tier.base_price || 0,
          supplier_currency: body.supplier_currency || 'USD',
          supplier_cost: tier.supplier_cost || 0,
          exchange_rate: body.exchange_rate || 1.0,
          markup_type: markupType,
          markup_value: markupValue,
          selling_price: tier.selling_price,
          currency: 'USD',
          is_active: true,
        });
      });
    } else {
      // Use standard adult/child/infant/senior pricing
      if (body.adult_price !== undefined && body.adult_price !== null) {
        pricingTiers.push({
          package_id: newPackage.id,
          tier_type: 'adult',
          tier_label: body.adult_tier_label || 'Adult (18+ years)',
          min_age: body.adult_min_age || 18,
          max_age: body.adult_max_age || null,
          base_price: body.base_adult_price || 0,
          supplier_currency: body.supplier_currency || 'USD',
          supplier_cost: body.supplier_cost_adult,
          exchange_rate: body.exchange_rate || 1.0,
          markup_type: markupType,
          markup_value: markupValue,
          selling_price: body.adult_price,
          currency: 'USD',
          is_active: true,
        });
      }

      if (body.child_price !== undefined && body.child_price !== null) {
        pricingTiers.push({
          package_id: newPackage.id,
          tier_type: 'child',
          tier_label: body.child_tier_label || 'Child (3-17 years)',
          min_age: body.child_min_age || 3,
          max_age: body.child_max_age || 17,
          base_price: body.base_child_price || 0,
          supplier_currency: body.supplier_currency || 'USD',
          supplier_cost: body.supplier_cost_child,
          exchange_rate: body.exchange_rate || 1.0,
          markup_type: markupType,
          markup_value: markupValue,
          selling_price: body.child_price,
          currency: 'USD',
          is_active: true,
        });
      }

      if (body.infant_price !== undefined && body.infant_price !== null) {
        pricingTiers.push({
          package_id: newPackage.id,
          tier_type: 'infant',
          tier_label: body.infant_tier_label || 'Infant (0-2 years)',
          min_age: 0,
          max_age: 2,
          base_price: body.base_infant_price || 0,
          supplier_currency: body.supplier_currency || 'USD',
          supplier_cost: body.supplier_cost_infant,
          exchange_rate: body.exchange_rate || 1.0,
          markup_type: markupType,
          markup_value: markupValue,
          selling_price: body.infant_price,
          currency: 'USD',
          is_active: true,
        });
      }

      if (body.senior_price !== undefined && body.senior_price !== null) {
        pricingTiers.push({
          package_id: newPackage.id,
          tier_type: 'senior',
          tier_label: body.senior_tier_label || 'Senior (65+ years)',
          min_age: 65,
          max_age: null,
          base_price: body.base_senior_price || 0,
          supplier_currency: body.supplier_currency || 'USD',
          supplier_cost: body.supplier_cost_senior,
          exchange_rate: body.exchange_rate || 1.0,
          markup_type: markupType,
          markup_value: markupValue,
          selling_price: body.senior_price,
          currency: 'USD',
          is_active: true,
        });
      }
    }

    if (pricingTiers.length > 0) {
      const { error: tiersError } = await supabase
        .from('package_pricing_tiers')
        .insert(pricingTiers);

      if (tiersError) {
        console.error('Failed to create pricing tiers:', tiersError);
        // Don't fail the whole request, package was created
      }
    }

    // Create add-ons if provided
    if (body.addons && Array.isArray(body.addons) && body.addons.length > 0) {
      const addonsToInsert = body.addons.map((addon: any) => ({
        package_id: newPackage.id,
        addon_name: addon.name,
        addon_code: addon.addon_code || null,
        description: addon.description || null,
        pricing_type: addon.pricing_type || 'per_person',
        price: addon.price,
        currency: 'USD',
        min_quantity: addon.min_quantity || 1,
        max_quantity: addon.max_quantity || null,
        is_required: addon.is_required || false,
        category: addon.category || null,
        display_order: 0,
        is_active: true,
      }));

      const { error: addonsError } = await supabase
        .from('package_addons')
        .insert(addonsToInsert);

      if (addonsError) {
        console.error('Failed to create add-ons:', addonsError);
        // Don't fail the whole request, package was created
      }
    }

    return NextResponse.json({ package: newPackage }, { status: 201 });
  } catch (err) {
    console.error('Failed to create package:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
