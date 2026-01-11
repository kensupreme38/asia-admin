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
      bio, 
      country, 
      genres,
      image_url,
      user_id,
      is_active,
      status
    } = body;

    // Use admin client to bypass RLS for admin operations
    const supabase = createAdminClient() || await createClient();

    // Convert ID to number if it's a numeric string (DJs table uses integer IDs)
    const djId = isNaN(Number(id)) ? id : Number(id);

    // Check if DJ exists
    const { data: existingDJ } = await supabase
      .from('djs')
      .select('id, name')
      .eq('id', djId)
      .single();

    if (!existingDJ) {
      return NextResponse.json(
        { error: 'DJ not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check if new name already exists
    if (name && name !== existingDJ.name) {
      const { data: nameExists } = await supabase
        .from('djs')
        .select('id')
        .eq('name', name)
        .single();

      if (nameExists) {
        return NextResponse.json(
          { error: 'DJ name already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio || null;
    if (country !== undefined) updateData.country = country || null;
    if (genres !== undefined) updateData.genres = genres || [];
    if (image_url !== undefined) updateData.image_url = image_url || null;
    if (user_id !== undefined) updateData.user_id = user_id || null;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (status !== undefined) updateData.status = status;

    // Update DJ
    const { data, error } = await supabase
      .from('djs')
      .update(updateData)
      .eq('id', djId)
      .select()
      .single();

    if (error) {
      console.error('Error updating DJ:', error);
      return NextResponse.json(
        { error: 'Failed to update DJ' },
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
    console.log(`[DELETE DJ] Received delete request for ID: ${id}, type: ${typeof id}`);
    
    // Use admin client with service role key to bypass RLS policies
    const adminClient = createAdminClient();
    const supabase = adminClient || await createClient();
    
    if (adminClient) {
      console.log('[DELETE DJ] ✓ Using service role key to bypass RLS');
    } else {
      console.log('[DELETE DJ] ⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY not found in environment!');
      console.log('[DELETE DJ] ⚠️ Using ANON_KEY - delete will likely fail due to RLS policies');
      console.log('[DELETE DJ] ⚠️ Please add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart server');
    }

    // Convert ID to number if it's a numeric string (DJs table uses integer IDs)
    const djId = isNaN(Number(id)) ? id : Number(id);
    console.log(`[DELETE DJ] Converted ID: ${djId}, type: ${typeof djId}`);

    // Check if DJ exists
    const { data: existingDJ, error: checkError } = await supabase
      .from('djs')
      .select('id, name')
      .eq('id', djId)
      .single();

    if (checkError) {
      console.error('[DELETE DJ] Error checking DJ existence:', checkError);
      // If it's a "not found" error, that's okay - we'll try to delete anyway
      if (checkError.code !== 'PGRST116') {
        return NextResponse.json(
          { error: `Error checking DJ: ${checkError.message}` },
          { status: 500 }
        );
      }
    }

    if (!existingDJ) {
      console.log(`[DELETE DJ] DJ with ID ${djId} not found`);
      return NextResponse.json(
        { error: 'DJ not found' },
        { status: 404 }
      );
    }

    console.log(`[DELETE DJ] Found DJ: ${existingDJ.name} (ID: ${existingDJ.id})`);

    // First, try to delete related votes (if foreign key constraint exists)
    // This is a safety measure - if votes table has foreign key, we need to delete votes first
    try {
      const { error: votesError } = await supabase
        .from('votes')
        .delete()
        .eq('dj_id', djId);
      
      if (votesError) {
        // Log but don't fail - might not have votes or foreign key might be CASCADE
        console.log(`[DELETE DJ] Note: Could not delete votes (might not exist): ${votesError.message}`);
      } else {
        console.log(`[DELETE DJ] Deleted related votes for DJ ${djId}`);
      }
    } catch (votesErr: any) {
      console.log(`[DELETE DJ] Votes deletion skipped: ${votesErr.message}`);
    }

    // Hard delete - actually remove from database
    console.log(`[DELETE DJ] Attempting to delete DJ ${djId} from database...`);
    console.log(`[DELETE DJ] Using client type: ${adminClient ? 'ADMIN (Service Role)' : 'ANON (may fail)'}`);
    
    const { data: deletedData, error } = await supabase
      .from('djs')
      .delete()
      .eq('id', djId)
      .select('id, name');
    
    console.log(`[DELETE DJ] Delete result - Error: ${error ? error.message : 'none'}, Data: ${deletedData ? JSON.stringify(deletedData) : 'none'}`);

    if (error) {
      console.error('[DELETE DJ] Error deleting DJ:', error);
      console.error('[DELETE DJ] Error code:', error.code);
      console.error('[DELETE DJ] Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: `Failed to delete DJ: ${error.message}`, details: error },
        { status: 500 }
      );
    }

    // Verify deletion by checking if DJ still exists
    // Use admin client for verification too to avoid RLS issues
    console.log(`[DELETE DJ] Delete operation completed. Checking if DJ still exists...`);
    const verifySupabase = createAdminClient() || await createClient();
    const { data: verifyDJ, error: verifyError } = await verifySupabase
      .from('djs')
      .select('id')
      .eq('id', djId)
      .single();

    if (verifyError && verifyError.code === 'PGRST116') {
      // PGRST116 means "not found" - this is good, means deletion worked
      console.log(`[DELETE DJ] ✓ Verification: DJ ${djId} successfully deleted (not found in database)`);
    } else if (verifyDJ) {
      // DJ still exists - deletion failed silently
      console.error(`[DELETE DJ] ✗ Verification FAILED: DJ ${djId} still exists in database!`);
      console.error(`[DELETE DJ] This might be due to RLS policies or permissions.`);
      console.error(`[DELETE DJ] Service Role Key available: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
      console.error(`[DELETE DJ] Admin client used: ${!!createAdminClient()}`);
      
      // If we have service role key but still failed, there might be a different issue
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json(
          { 
            error: 'Delete operation reported success but DJ still exists. Please check database directly or Supabase RLS policies.',
            deletedData: deletedData,
            stillExists: true,
            hint: 'Service Role Key is set but deletion may have failed. Check server logs for details.'
          },
          { status: 500 }
        );
      } else {
        return NextResponse.json(
          { 
            error: 'Delete operation reported success but DJ still exists in database. This is likely due to RLS policies. Please add SUPABASE_SERVICE_ROLE_KEY to .env.local',
            deletedData: deletedData,
            stillExists: true,
            hint: 'Add SUPABASE_SERVICE_ROLE_KEY to .env.local file. See ENV_SETUP.md for instructions.'
          },
          { status: 500 }
        );
      }
    } else {
      console.log(`[DELETE DJ] ✓ Verification: DJ ${djId} deleted successfully`);
    }

    // Log for debugging
    console.log(`[DELETE DJ] DJ ${djId} deleted successfully. Deleted data:`, deletedData);

    return NextResponse.json({ 
      success: true, 
      deleted: true,
      deletedId: djId,
      deletedData: deletedData || [],
      verified: !verifyDJ
    });
  } catch (error: any) {
    console.error('[DELETE DJ] Unexpected error:', error);
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    return NextResponse.json(
      { error: `Internal server error: ${error.message}`, stack: error.stack },
      { status: 500 }
    );
  }
}

