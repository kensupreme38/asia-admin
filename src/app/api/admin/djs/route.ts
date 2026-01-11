import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient() || await createClient();
    
    let query = supabase
      .from('djs')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`name.ilike.%${search}%,bio.ilike.%${search}%,country.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Error fetching DJs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch DJs' },
        { status: 500 }
      );
    }

    // Fetch vote counts for these DJs
    const djIds = (data || []).map((dj: any) => dj.id);
    const { data: votesData, error: votesError } = await supabase
      .from('votes')
      .select('dj_id')
      .in('dj_id', djIds);

    if (votesError) {
      console.error('Error fetching votes:', votesError);
    }

    const votesCountMap = new Map<number, number>();
    if (votesData) {
      votesData.forEach((vote: any) => {
        const count = votesCountMap.get(vote.dj_id) || 0;
        votesCountMap.set(vote.dj_id, count + 1);
      });
    }

    const djsWithVotes = (data || []).map((dj: any) => ({
      ...dj,
      votes_count: votesCountMap.get(dj.id) || 0,
    }));

    return NextResponse.json({
      data: djsWithVotes,
      total: count || 0,
      page,
      limit
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth();

    const body = await request.json();
    const { 
      name, 
      bio, 
      country, 
      genres,
      image_url,
      user_id,
      is_active,
      status
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'DJ name is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient() || await createClient();

    // Check if DJ name already exists
    const { data: existingDJ } = await supabase
      .from('djs')
      .select('id')
      .eq('name', name)
      .single();

    if (existingDJ) {
      return NextResponse.json(
        { error: 'DJ name already exists' },
        { status: 400 }
      );
    }

    // Insert new DJ
    const { data, error } = await supabase
      .from('djs')
      .insert({
        name,
        bio: bio || null,
        country: country || null,
        genres: genres || [],
        image_url: image_url || null,
        user_id: user_id || null,
        is_active: is_active !== undefined ? is_active : true,
        status: status || 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating DJ:', error);
      return NextResponse.json(
        { error: 'Failed to create DJ' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

