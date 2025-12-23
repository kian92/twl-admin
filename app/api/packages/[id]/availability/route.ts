import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get available and blocked dates for a package within a date range
 * Useful for calendar components and date pickers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: packageId } = params;
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    // Fetch blocked dates within the range
    const { data: blockedDates, error } = await supabase
      .from('package_blocked_dates')
      .select('id, start_date, end_date, reason')
      .eq('package_id', packageId)
      .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`);

    if (error) {
      console.error('Error fetching blocked dates:', error);
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Generate list of blocked dates (expand ranges into individual dates)
    const blockedDatesList: string[] = [];

    if (blockedDates && blockedDates.length > 0) {
      for (const range of blockedDates) {
        const start = new Date(range.start_date);
        const end = new Date(range.end_date);

        for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
          blockedDatesList.push(date.toISOString().split('T')[0]);
        }
      }
    }

    return NextResponse.json({
      package_id: packageId,
      start_date: startDate,
      end_date: endDate,
      blocked_dates: blockedDatesList,
      blocked_ranges: blockedDates || [],
    });
  } catch (error) {
    console.error('Unexpected error in GET /api/packages/[id]/availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
