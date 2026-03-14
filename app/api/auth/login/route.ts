import { NextResponse } from 'next/server';
import { createJWT, AUTH_COOKIE_NAME, SESSION_DURATION_MS } from '@/lib/auth';
import { createServerClient } from '@/lib/db/supabase';
import { getTenant } from '@/lib/kernel/tenant';
import { resolvePermissions } from '@/lib/kernel/resolve-permissions';

/**
 * POST /api/auth/login
 *
 * Dev/fallback login — email + dev password.
 * In production, use Google OAuth (/api/auth/google).
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    const devPassword = process.env.DEV_PASSWORD;
    if (!devPassword) {
      return NextResponse.json(
        { success: false, message: 'Dev login not available' },
        { status: 403 }
      );
    }

    if (password !== devPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { success: false, message: 'No active account found for this email' },
        { status: 401 }
      );
    }

    // Update last login
    await supabase
      .from('user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const tenant = await getTenant();
    const permissions = await resolvePermissions(user.role, tenant.id);
    const jwt = await createJWT({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url || '',
      permissions,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        avatarUrl: user.avatar_url,
      },
    });

    response.cookies.set(AUTH_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_MS / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
