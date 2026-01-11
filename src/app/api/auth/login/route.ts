import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { verifyPassword } from '@/lib/auth/password';
import { createSession } from '@/lib/auth/session';
import { loginSchema } from '@/lib/schemas';

// Simple in-memory rate limiting (for production, use Redis or similar)
const loginAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);

  if (!attempts || now > attempts.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return true;
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    return false;
  }

  attempts.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIP || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIP = getClientIP(request);
    // if (!checkRateLimit(clientIP)) {
    //   return NextResponse.json(
    //     { error: 'Too many login attempts. Please try again later.' },
    //     { status: 429 }
    //   );
    // }

    // Validate input
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { username, password } = validationResult.data;

    const supabase = createAdminClient() || await createClient();
    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, password_hash, is_active')
      .eq('username', username)
      .single();

    if (error || !user) {
      // Generic error message to prevent username enumeration
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Invalid username or password' }, // Generic message
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    loginAttempts.delete(clientIP);

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);

    // Get IP and user agent for session
    const userAgent = request.headers.get('user-agent') || undefined;

    // Create session with secure token
    await createSession(user.id, clientIP, userAgent);

    return NextResponse.json({
      success: true,
      message: 'Login successful',
    });
  } catch (error: any) {
    // Generic error message
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

