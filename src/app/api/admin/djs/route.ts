import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    await requireAuth();

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient() || await createClient();
    const { data, error } = await supabase
      .from('djs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching DJs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch DJs' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
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

