import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Fetch single package with all pricing data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: packageData, error } = await supabase
      .from('experience_packages')
      .select(`
        *,
        pricing_tiers:package_pricing_tiers(*),
        group_pricing:package_group_pricing(*),
        seasonal_pricing:package_seasonal_pricing(*),
        time_based_discounts:package_time_based_discounts(*),
        addons:package_addons(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(packageData, { status: 200 });
  } catch (err) {
    console.error('Failed to fetch package:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PUT - Update package
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Validate that experience_id is not being changed, or if it is, that it exists
    if (body.experience_id) {
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
    }

    // Update package (including new use_custom_tiers flag)
    const { data: updatedPackage, error: packageError } = await supabase
      .from('experience_packages')
      .update({
        package_name: body.package_name,
        package_code: body.package_code,
        description: body.description,
        min_group_size: body.min_group_size,
        max_group_size: body.max_group_size,
        available_from: body.available_from || null,
        available_to: body.available_to || null,
        inclusions: body.inclusions || [],
        exclusions: body.exclusions || [],
        display_order: body.display_order,
        is_active: body.is_active,
        requires_full_payment: body.requires_full_payment || false,
        use_custom_tiers: body.use_custom_tiers || false, // NEW: Set custom tiers flag
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (packageError) {
      return NextResponse.json({ error: packageError.message }, { status: 500 });
    }

    // Update pricing tiers if provided
    if (body.pricing_tiers) {
      // Delete existing tiers
      await supabase.from('package_pricing_tiers').delete().eq('package_id', id);

      // Get markup settings
      const markupType = body.markup_type || 'none';
      const markupValue = body.markup_value || 0;

      // Check if using custom pricing tiers
      if (body.use_custom_tiers && body.custom_pricing_tiers && Array.isArray(body.custom_pricing_tiers)) {
        // Use custom pricing tiers (with new fields)
        const tiersToInsert = body.custom_pricing_tiers.map((tier: any, index: number) => ({
          package_id: id,
          tier_type: tier.tier_type,
          tier_label: tier.tier_label,
          tier_code: tier.tier_code || `${tier.tier_type.toUpperCase()}_${index + 1}`,
          description: tier.description || null,
          min_age: tier.min_age || null,
          max_age: tier.max_age || null,
          base_price: tier.base_price || 0,
          selling_price: tier.selling_price,
          supplier_currency: body.supplier_currency || 'USD',
          supplier_cost: tier.supplier_cost || 0,
          exchange_rate: body.exchange_rate || 1.0,
          markup_type: markupType,
          markup_value: markupValue,
          currency: 'USD',
          display_order: tier.display_order !== undefined ? tier.display_order : index,
          requires_adult_accompaniment: tier.requires_adult_accompaniment || (tier.tier_type === 'child' || tier.tier_type === 'infant'),
          max_per_booking: tier.max_per_booking || null,
          booking_notes: tier.booking_notes || null,
          is_active: true,
        }));

        if (tiersToInsert.length > 0) {
          await supabase.from('package_pricing_tiers').insert(tiersToInsert);
        }
      } else {
        // Use standard pricing_tiers array format
        const tiersToInsert = body.pricing_tiers.map((tier: any) => ({
          package_id: id,
          tier_type: tier.tier_type,
          tier_label: tier.tier_label,
          min_age: tier.min_age,
          max_age: tier.max_age,
          base_price: tier.base_price,
          supplier_currency: tier.supplier_currency || body.supplier_currency || 'USD',
          supplier_cost: tier.supplier_cost,
          exchange_rate: tier.exchange_rate || body.exchange_rate || 1.0,
          markup_type: tier.markup_type || body.markup_type || 'none',
          markup_value: tier.markup_value || body.markup_value || 0,
          selling_price: tier.selling_price,
          currency: tier.currency || 'USD',
          cost_price: tier.cost_price,
          is_active: tier.is_active !== false,
        }));

        if (tiersToInsert.length > 0) {
          await supabase.from('package_pricing_tiers').insert(tiersToInsert);
        }
      }
    }

    // Update add-ons if provided
    if (body.addons !== undefined) {
      // Delete existing add-ons
      await supabase.from('package_addons').delete().eq('package_id', id);

      // Create new add-ons if any
      if (Array.isArray(body.addons) && body.addons.length > 0) {
        const addonsToInsert = body.addons.map((addon: any, index: number) => ({
          package_id: id,
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
          display_order: index,
          is_active: true,
        }));

        const { error: addonsError } = await supabase
          .from('package_addons')
          .insert(addonsToInsert);

        if (addonsError) {
          console.error('Failed to update add-ons:', addonsError);
        }
      }
    }

    return NextResponse.json({ package: updatedPackage }, { status: 200 });
  } catch (err) {
    console.error('Failed to update package:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE - Delete package
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('experience_packages')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Failed to delete package:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
