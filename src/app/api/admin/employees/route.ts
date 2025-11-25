import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';

export async function GET() {
  try {
    await requireAuth();

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient() || await createClient();
    const { data, error } = await supabase
      .from('employee_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching employees:', error);
      return NextResponse.json(
        { error: 'Failed to fetch employees' },
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
      full_name, 
      email, 
      phone, 
      dateOfBirth, 
      gender, 
      address, 
      referral_code,
      user_id 
    } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient() || await createClient();

    // Check if email already exists
    const { data: existingEmployee } = await supabase
      .from('employee_profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 400 }
      );
    }

    // Insert new employee
    const { data, error } = await supabase
      .from('employee_profiles')
      .insert({
        full_name: full_name || name || null,
        email,
        phone: phone || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        address: address || null,
        referral_code: referral_code || null,
        user_id: user_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      return NextResponse.json(
        { error: 'Failed to create employee' },
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

