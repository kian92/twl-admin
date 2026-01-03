import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const packageId = searchParams.get('package_id');

    if (!packageId) {
      return NextResponse.json(
        { error: 'package_id is required' },
        { status: 400 }
      );
    }

    // Fetch blocked dates for the package
    const { data, error } = await supabase
      .from('package_blocked_dates')
      .select(`
        id,
        package_id,
        start_date,
        end_date,
        reason,
        notes,
        created_at,
        created_by
      `)
      .eq('package_id', packageId)
      .order('start_date', { ascending: true });

    if (error) {
      console.error('Error fetching blocked dates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch blocked dates', details: error },
        { status: 500 }
      );
    }

    console.log(`Fetched ${data?.length || 0} blocked dates for package ${packageId}`);
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in GET /api/admin/blocked-dates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { package_id, start_date, end_date, reason, notes } = body;

    // Validation
    if (!package_id || !start_date || !end_date || !reason) {
      return NextResponse.json(
        { error: 'package_id, start_date, end_date, and reason are required' },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(start_date) > new Date(end_date)) {
      return NextResponse.json(
        { error: 'start_date must be before or equal to end_date' },
        { status: 400 }
      );
    }

    // Verify package exists
    const { data: packageExists, error: packageError } = await supabase
      .from('experience_packages')
      .select('id')
      .eq('id', package_id)
      .single();

    if (packageError || !packageExists) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    // Check for overlapping blocked dates
    const { data: overlapping, error: overlapError } = await supabase
      .from('package_blocked_dates')
      .select('id, start_date, end_date, reason')
      .eq('package_id', package_id)
      .or(`and(start_date.lte.${end_date},end_date.gte.${start_date})`);

    if (overlapError) {
      console.error('Error checking overlapping dates:', overlapError);
      return NextResponse.json(
        { error: 'Failed to check overlapping dates' },
        { status: 500 }
      );
    }

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        {
          error: 'Date range overlaps with existing blocked dates',
          overlapping: overlapping
        },
        { status: 400 }
      );
    }

    // Insert blocked date
    const { data, error } = await supabase
      .from('package_blocked_dates')
      .insert({
        package_id,
        start_date,
        end_date,
        reason,
        notes: notes || null,
      })
      .select(`
        id,
        package_id,
        start_date,
        end_date,
        reason,
        notes,
        created_at,
        created_by
      `)
      .single();

    if (error) {
      console.error('Error creating blocked date:', error);
      return NextResponse.json(
        { error: 'Failed to create blocked date', details: error },
        { status: 500 }
      );
    }

    console.log('Successfully created blocked date:', data);
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/admin/blocked-dates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
