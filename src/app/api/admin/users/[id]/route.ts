import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { hashPassword } from '@/lib/auth/password';
import { requireAuth } from '@/lib/auth/session';
import { adminUserSchema } from '@/lib/schemas';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    
    // Validate input (password is optional for updates)
    const validationResult = adminUserSchema.partial().safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { username, password, full_name, email, role, permissions, is_active } = validationResult.data;

    // Use admin client to bypass RLS for admin operations
    const adminClient = createAdminClient();
    const supabase = adminClient || await createClient();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('admin_users')
      .select('id, username')
      .eq('id', id)
      .single();

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If username is being changed, check if new username already exists
    if (username && username !== existingUser.username) {
      const { data: usernameExists } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', username)
        .single();

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (username) updateData.username = username;
    if (full_name !== undefined) updateData.full_name = full_name || null;
    if (email !== undefined) updateData.email = email || null;
    if (role) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password_hash = await hashPassword(password);
    }

    // Update user
    const { data, error } = await supabase
      .from('admin_users')
      .update(updateData)
      .eq('id', id)
      .select('id, username, full_name, email, role, permissions, is_active, last_login, created_at, updated_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update admin user' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    
    // Use admin client to bypass RLS for admin operations
    const adminClient = createAdminClient();
    const supabase = adminClient || await createClient();

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Delete user
    const { data: deletedData, error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id)
      .select('id');

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete user' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      deleted: true,
      deletedId: id
    });
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

