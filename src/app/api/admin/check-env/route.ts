import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    await requireAuth();

    const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminClient = createAdminClient();
    const canUseAdminClient = !!adminClient;

    return NextResponse.json({
      hasServiceRoleKey,
      canUseAdminClient,
      message: hasServiceRoleKey 
        ? 'Service Role Key is configured. Admin operations should work.'
        : '⚠️ Service Role Key is NOT set. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart server.',
      instructions: hasServiceRoleKey 
        ? null
        : {
            step1: 'Go to Supabase Dashboard → Settings → API',
            step2: 'Copy the service_role key (secret)',
            step3: 'Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_key_here',
            step4: 'Restart the development server'
          }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

