/**
 * sanitizeError
 *
 * The ONLY place in the codebase that is allowed to touch error messages
 * before they are sent to any client (browser, mobile, API consumer).
 *
 * Rule: zero vendor names, zero internal tool names, zero internal URLs
 * ever reach a user. CRM is a black box to them.
 *
 * Add to this list whenever a new integration is added.
 */

// Terms that must never appear in a user-facing message.
// "markyy" is allowed — it is our white-label product name visible to clients.
// The underlying SaaS identity (GoHighLevel / leadconnector) must NEVER appear.
// NOTE: "ghl" was removed — it no longer exists in our codebase, and the broad
// regex was incorrectly scrubbing legitimate Markyy API error messages that
// happened to contain those characters (e.g. URL fragments in error strings).
const BLOCKED_TERMS: RegExp[] = [
  /go\s*high\s*level/gi,
  /leadconnectorhq/gi,
  /lead\s*connector/gi,
  /highlevel/gi,
  /services\.leadconnectorhq\.com/gi,
  /\bpit\b/gi,          // Private Integration Token — internal auth concept
];

const SAFE_MESSAGE = 'Something went wrong. Please try again.';

/**
 * Returns a sanitized error message safe to send to the client.
 * Strips all vendor identifiers. Falls back to a generic CRM message
 * if the original message itself contains blocked terms.
 */
export function sanitizeError(err: unknown): string {
  const raw =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
      ? err
      : SAFE_MESSAGE;

  const containsVendorTerm = BLOCKED_TERMS.some(re => re.test(raw));
  if (containsVendorTerm) return SAFE_MESSAGE;

  // Also strip any raw HTTP URLs that could expose internal infrastructure
  const stripped = raw.replace(/https?:\/\/[^\s"')]+/g, '[internal]');

  return stripped || SAFE_MESSAGE;
}

/**
 * Wraps a Next.js API route handler and guarantees:
 *  1. No vendor name leaks in error responses
 *  2. Consistent error shape: { error: string }
 *
 * Usage:
 *   export const GET = crmRoute(async (req) => { ... return NextResponse.json(...) });
 */
import { NextRequest, NextResponse } from 'next/server';

type RouteHandler = (req: NextRequest, ctx?: any) => Promise<NextResponse>;

export function crmRoute(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx?: any) => {
    try {
      return await handler(req, ctx);
    } catch (err: unknown) {
      const message = sanitizeError(err);
      // Log the real error server-side only — never reaches the client
      console.error('[CRM]', err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  };
}
