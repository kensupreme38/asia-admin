import { cookies } from 'next/headers';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { randomBytes } from 'crypto';

export interface AdminUser {
  id: string;
  username: string;
  full_name?: string;
  email?: string;
  role: string;
  permissions: Record<string, any>;
}

// Generate cryptographically secure session token
function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export async function getSession(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;

  if (!sessionToken) {
    return null;
  }

  try {
    const supabase = createAdminClient() || await createClient();
    
    // Verify session token and get user info
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select(`
        id,
        token,
        expires_at,
        user_id,
        admin_users (
          id,
          username,
          full_name,
          email,
          role,
          permissions,
          is_active
        )
      `)
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session || !session.admin_users) {
      return null;
    }

    const user = session.admin_users as any;
    
    if (!user.is_active) {
      // User is deactivated, delete session
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('token', sessionToken);
      return null;
    }

    // Update last accessed time
    await supabase
      .from('admin_sessions')
      .update({ last_accessed_at: new Date().toISOString() })
      .eq('token', sessionToken);

    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name || undefined,
      email: user.email || undefined,
      role: user.role,
      permissions: user.permissions || {},
    };
  } catch (error) {
    return null;
  }
}

export async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  try {
    const supabase = createAdminClient() || await createClient();
    
    // Create session in database
    const { error } = await supabase
      .from('admin_sessions')
      .insert({
        user_id: userId,
        token: sessionToken,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }

    // Set secure cookie
    cookieStore.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed from 'lax' to 'strict' for better security
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });
  } catch (error) {
    console.error('Error in createSession:', error);
    throw error;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('admin_session')?.value;

  if (sessionToken) {
    try {
      const supabase = createAdminClient() || await createClient();
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('token', sessionToken);
    } catch (error) {
      console.error('Error destroying session:', error);
    }
  }

  cookieStore.delete('admin_session');
}

export async function requireAuth(): Promise<AdminUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

