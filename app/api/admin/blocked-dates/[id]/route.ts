import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;

    const { start_date, end_date, reason, notes } = body;

    // Validation
    if (!start_date || !end_date || !reason) {
      return NextResponse.json(
        { error: 'start_date, end_date, and reason are required' },
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

    // Get existing blocked date to get package_id
    const { data: existing, error: existingError } = await supabase
      .from('package_blocked_dates')
      .select('package_id')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json(
        { error: 'Blocked date not found' },
        { status: 404 }
      );
    }

    // Check for overlapping blocked dates (excluding current record)
    const { data: overlapping, error: overlapError } = await supabase
      .from('package_blocked_dates')
      .select('id, start_date, end_date, reason')
      .eq('package_id', existing.package_id)
      .neq('id', id)
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

    // Update blocked date
    const { data, error } = await supabase
      .from('package_blocked_dates')
      .update({
        start_date,
        end_date,
        reason,
        notes: notes || null,
      })
      .eq('id', id)
      .select(`
        id,
        package_id,
        start_date,
        end_date,
        reason,
        notes,
        created_at,
        updated_at,
        created_by
      `)
      .single();

    if (error) {
      console.error('Error updating blocked date:', error);
      return NextResponse.json(
        { error: 'Failed to update blocked date' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Unexpected error in PUT /api/admin/blocked-dates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Delete blocked date
    const { error } = await supabase
      .from('package_blocked_dates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blocked date:', error);
      return NextResponse.json(
        { error: 'Failed to delete blocked date' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/admin/blocked-dates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
