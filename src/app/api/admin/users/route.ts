import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth/password';
import { requireAuth } from '@/lib/auth/session';
import { adminUserSchema } from '@/lib/schemas';

export async function GET() {
  try {
    await requireAuth();

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient() || await createClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, full_name, email, role, permissions, is_active, last_login, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch admin users' },
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
    
    // Validate input
    const validationResult = adminUserSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { username, password, full_name, email, role, permissions, is_active } = validationResult.data;

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient() || await createClient();

    // Check if username already exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);

    // Insert new user
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username,
        password_hash,
        full_name: full_name || null,
        email: email || null,
        role: role || 'admin',
        permissions: permissions || {},
        is_active: is_active !== undefined ? is_active : true,
      })
      .select('id, username, full_name, email, role, permissions, is_active, last_login, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create admin user' },
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
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

