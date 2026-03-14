import { NextResponse } from 'next/server';
import { getSessionFromApiRequest, createJWT, AUTH_COOKIE_NAME, SESSION_DURATION_MS } from '@/lib/auth';
import { createServerClient } from '@/lib/db/supabase';
import { getTenant } from '@/lib/kernel/tenant';
import { resolvePermissions } from '@/lib/kernel/resolve-permissions';

/**
 * GET /api/auth/session
 * Return the current authenticated user, or null.
 * Always fetches the latest role from DB — JWT role can be stale if an admin
 * changed the user's role after the JWT was issued.
 *
 * If the DB role differs from the JWT role, a new JWT is issued with fresh
 * permissions so that access control changes take effect at the next session poll.
 */
export async function GET(request: Request) {
  const session = await getSessionFromApiRequest(request);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  // Refresh role + active status from DB so role changes take effect immediately
  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, is_active, full_name')
    .eq('id', session.id)
    .maybeSingle();

  // Deny if user was deactivated or removed since last login
  if (!profile || !profile.is_active) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const responseData = {
    user: {
      id: session.id,
      email: session.email,
      fullName: profile.full_name || session.fullName,
      role: profile.role,          // always use DB role — never stale JWT role
      avatarUrl: session.avatarUrl,
      permissions: session.permissions, // from JWT — used for client-side nav filtering
    },
  };

  // If role changed since last login, re-issue JWT with fresh permissions
  if (profile.role !== session.role) {
    try {
      const tenant = await getTenant();
      const permissions = await resolvePermissions(profile.role, tenant.id);
      const newJwt = await createJWT({
        id: session.id,
        email: session.email,
        fullName: profile.full_name || session.fullName,
        role: profile.role,
        avatarUrl: session.avatarUrl ?? '',
        permissions,
      });
      // Return fresh permissions so nav updates immediately without a second poll
      const response = NextResponse.json({ user: { ...responseData.user, permissions } });
      response.cookies.set(AUTH_COOKIE_NAME, newJwt, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: SESSION_DURATION_MS / 1000,
        path: '/',
      });
      return response;
    } catch {
      // Non-fatal: fall through and return user data without re-issuing JWT
    }
  }

  return NextResponse.json(responseData);
}
