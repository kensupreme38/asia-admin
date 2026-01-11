import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth/session';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const body = await request.json();
    const { 
      name, 
      full_name, 
      email, 
      phone, 
      date_of_birth, 
      gender, 
      address, 
      referral_code,
      user_id 
    } = body;

    // Use admin client to bypass RLS for admin operations
    const adminClient = createAdminClient();
    const supabase = adminClient || await createClient();
    
    if (adminClient) {
      console.log('[DELETE EMPLOYEE] ✓ Using service role key to bypass RLS');
    } else {
      console.log('[DELETE EMPLOYEE] ⚠️ WARNING: Using ANON_KEY - delete may fail due to RLS policies');
    }

    // Check if employee exists
    const { data: existingEmployee } = await supabase
      .from('employee_profiles')
      .select('id, email')
      .eq('id', id)
      .single();

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // If email is being changed, check if new email already exists
    if (email && email !== existingEmployee.email) {
      const { data: emailExists } = await supabase
        .from('employee_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (full_name !== undefined || name !== undefined) {
      updateData.full_name = full_name || name || null;
    }
    if (email !== undefined) updateData.email = email || null;
    if (phone !== undefined) updateData.phone = phone || null;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;
    if (gender !== undefined) updateData.gender = gender || null;
    if (address !== undefined) updateData.address = address || null;
    if (referral_code !== undefined) updateData.referral_code = referral_code || null;
    if (user_id !== undefined) updateData.user_id = user_id || null;

    // Update employee
    const { data, error } = await supabase
      .from('employee_profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating employee:', error);
      return NextResponse.json(
        { error: 'Failed to update employee' },
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
    console.error('Error:', error);
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
    console.log(`[DELETE EMPLOYEE] Received delete request for ID: ${id}`);
    
    // Use admin client to bypass RLS for admin operations
    const adminClient = createAdminClient();
    const supabase = adminClient || await createClient();
    
    if (adminClient) {
      console.log('[DELETE EMPLOYEE] ✓ Using service role key to bypass RLS');
    } else {
      console.log('[DELETE EMPLOYEE] ⚠️ WARNING: Using ANON_KEY - delete may fail due to RLS policies');
    }

    // Check if employee exists
    const { data: existingEmployee, error: checkError } = await supabase
      .from('employee_profiles')
      .select('id, email')
      .eq('id', id)
      .single();

    if (checkError || !existingEmployee) {
      console.error('[DELETE EMPLOYEE] Error checking employee existence:', checkError);
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    console.log(`[DELETE EMPLOYEE] Found employee: ${existingEmployee.email} (ID: ${id})`);

    // Delete employee
    console.log(`[DELETE EMPLOYEE] Attempting to delete employee ${id} from database...`);
    const { data: deletedData, error } = await supabase
      .from('employee_profiles')
      .delete()
      .eq('id', id)
      .select('id, email');

    if (error) {
      console.error('[DELETE EMPLOYEE] Error deleting employee:', error);
      return NextResponse.json(
        { error: `Failed to delete employee: ${error.message}`, details: error },
        { status: 500 }
      );
    }

    // Verify deletion
    console.log(`[DELETE EMPLOYEE] Delete operation completed. Checking if employee still exists...`);
    const verifySupabase = createAdminClient() || await createClient();
    const { data: verifyEmployee, error: verifyError } = await verifySupabase
      .from('employee_profiles')
      .select('id')
      .eq('id', id)
      .single();

    if (verifyError && verifyError.code === 'PGRST116') {
      console.log(`[DELETE EMPLOYEE] ✓ Verification: Employee ${id} successfully deleted`);
    } else if (verifyEmployee) {
      console.error(`[DELETE EMPLOYEE] ✗ Verification FAILED: Employee ${id} still exists!`);
      return NextResponse.json(
        { 
          error: 'Delete operation reported success but employee still exists. This might be due to RLS policies.',
          deletedData: deletedData,
          stillExists: true,
          hint: process.env.SUPABASE_SERVICE_ROLE_KEY 
            ? 'Service Role Key is set but deletion may have failed. Check server logs.'
            : 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart server.'
        },
        { status: 500 }
      );
    } else {
      console.log(`[DELETE EMPLOYEE] ✓ Verification: Employee ${id} deleted successfully`);
    }

    console.log(`[DELETE EMPLOYEE] Employee ${id} deleted successfully. Deleted data:`, deletedData);

    return NextResponse.json({ 
      success: true, 
      deleted: true,
      deletedId: id,
      deletedData: deletedData || []
    });
  } catch (error: any) {
    console.error('[DELETE EMPLOYEE] Unexpected error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}

