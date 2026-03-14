import { NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Clear the session cookie and redirect to /login.
 */
export async function POST(request: Request) {
  const host = new URL(request.url).origin;
  const response = NextResponse.redirect(`${host}/login`);
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}

/**
 * GET /api/auth/logout — convenience redirect
 */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const response = NextResponse.redirect(new URL('/login', origin));
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
