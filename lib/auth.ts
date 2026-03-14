import type { NextRequest } from 'next/server';
import { parse } from 'cookie';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// ─────────────────────────────────────────
// Constants
// ─────────────────────────────────────────
export const AUTH_COOKIE_NAME = 'legacy_session';
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

// ─────────────────────────────────────────
// Session Types
// ─────────────────────────────────────────
export interface AuthSession {
  id: string;       // profiles UUID
  email: string;
  fullName: string;
  role: string;     // system role slug OR custom role slug
  avatarUrl?: string;
  expires: number;
  /** Flat list of granted permission keys — populated at login, baked into JWT.
   *  Always present. Replaces runtime RBAC map lookups on every request.
   *  super_admin receives every permission key.
   *  Custom roles receive the permissions stored in tenant_custom_roles. */
  permissions: string[];
}

export const ROLES = [
  'super_admin',
  'admin',
  'broker',
  'agent',
  'member',
  'viewer',
] as const;
export type Role = (typeof ROLES)[number];

// ─────────────────────────────────────────
// JWT Secret
// ─────────────────────────────────────────
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || 'legacy-office-dev-secret-change-in-production';
  return new TextEncoder().encode(secret);
}

// ─────────────────────────────────────────
// JWT Creation & Verification
// ─────────────────────────────────────────
export async function createJWT(session: Omit<AuthSession, 'expires'>): Promise<string> {
  const secret = getJwtSecret();
  const expiresAt = Math.floor((Date.now() + SESSION_DURATION_MS) / 1000);
  return new SignJWT({
    id: session.id,
    email: session.email,
    fullName: session.fullName,
    role: session.role,
    avatarUrl: session.avatarUrl || '',
    perms: session.permissions ?? [],
  } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setIssuer('legacy-realty-office')
    .setSubject(session.id)
    .sign(secret);
}

export async function verifyJWT(token: string): Promise<AuthSession | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, { issuer: 'legacy-realty-office' });
    return {
      id: (payload.id as string) || payload.sub || '',
      email: (payload.email as string) || '',
      fullName: (payload.fullName as string) || '',
      role: ((payload.role as string) || 'viewer'),
      avatarUrl: (payload.avatarUrl as string) || '',
      expires: (payload.exp || 0) * 1000,
      // Read permissions from JWT claim; fall back to static map for legacy JWTs
      permissions: Array.isArray(payload.perms)
        ? (payload.perms as string[])
        : getPermissionsForRole(((payload.role as string) || 'viewer') as Role),
    };
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
// Session Extraction
// ─────────────────────────────────────────
export function isSessionValid(session: AuthSession, now = Date.now()): boolean {
  return session.expires > now;
}

export function isAdmin(session: AuthSession): boolean {
  return session.role === 'admin' || session.role === 'super_admin';
}

export function isSuperAdmin(session: AuthSession): boolean {
  return session.role === 'super_admin';
}

export function isBrokerOrAbove(session: AuthSession): boolean {
  return ['super_admin', 'admin', 'broker'].includes(session.role);
}

export function hasRole(session: AuthSession, ...roles: Role[]): boolean {
  return roles.includes(session.role as Role);
}

/** Middleware — extract session from NextRequest */
export async function getSessionFromRequest(request: NextRequest): Promise<AuthSession | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  const token = cookies[AUTH_COOKIE_NAME];
  if (!token) return null;
  const session = await verifyJWT(token);
  if (session && isSessionValid(session)) return session;
  return null;
}

/** API route handlers — extract session from standard Request */
export async function getSessionFromApiRequest(request: Request): Promise<AuthSession | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  const token = cookies[AUTH_COOKIE_NAME];
  if (!token) return null;
  const session = await verifyJWT(token);
  if (session && isSessionValid(session)) return session;
  return null;
}

/** Server components — extract session from cookie value */
export async function getSessionFromCookie(cookieValue?: string | null): Promise<AuthSession | null> {
  if (!cookieValue) return null;
  const session = await verifyJWT(cookieValue);
  if (session && isSessionValid(session)) return session;
  return null;
}

// ─────────────────────────────────────────
// RBAC Permissions — Comprehensive Matrix
// ─────────────────────────────────────────
//
// Role Hierarchy (descending privilege):
//   super_admin  — Full platform control. All features, all data, all users.
//                  Can access developer tools, impersonate users, manage billing,
//                  configure integrations, toggle features, view audit logs.
//   admin        — Office management. Manage team, listings, transactions, settings.
//                  Cannot access system internals, billing, or developer tools.
//   broker       — Supervises agents. View reports, manage own + agents' deals.
//   agent        — Field operator. Manage own listings, transactions, CRM contacts.
//   member       — Support staff (TC, marketing). View team, limited CRM access.
//   viewer       — Read-only access. Dashboard + own profile only.
//

export const RBAC: Record<string, Role[]> = {
  // ── Universal ──
  sign_in:                 ['super_admin', 'admin', 'broker', 'agent', 'member', 'viewer'],
  view_dashboard:          ['super_admin', 'admin', 'broker', 'agent', 'member', 'viewer'],
  view_own_profile:        ['super_admin', 'admin', 'broker', 'agent', 'member', 'viewer'],
  edit_own_profile:        ['super_admin', 'admin', 'broker', 'agent', 'member', 'viewer'],

  // ── Team ──
  view_team:               ['super_admin', 'admin', 'broker', 'agent', 'member'],
  manage_team:             ['super_admin', 'admin', 'broker'],  // brokers invite/manage agents

  // ── Listings & Properties ──
  view_listings:           ['super_admin', 'admin', 'broker', 'agent', 'member'],
  manage_listings:         ['super_admin', 'admin', 'broker', 'agent'],
  delete_listings:         ['super_admin', 'admin', 'broker'],

  // ── Transactions ──
  view_transactions:       ['super_admin', 'admin', 'broker', 'agent', 'member'],
  manage_transactions:     ['super_admin', 'admin', 'broker', 'agent'],
  delete_transactions:     ['super_admin', 'admin'],

  // ── CRM / Contacts ──
  view_crm:                ['super_admin', 'admin', 'broker', 'agent', 'member'],
  manage_crm:              ['super_admin', 'admin', 'broker', 'agent'],
  import_export_crm:       ['super_admin', 'admin', 'broker'],
  delete_crm_records:      ['super_admin', 'admin'],

  // ── Commission & Financials ──
  view_own_commission:     ['super_admin', 'admin', 'broker', 'agent'],
  view_all_commissions:    ['super_admin', 'admin', 'broker'],
  manage_commissions:      ['super_admin', 'admin'],

  // ── Calendar & Showings ──
  view_calendar:           ['super_admin', 'admin', 'broker', 'agent', 'member'],
  manage_calendar:         ['super_admin', 'admin', 'broker', 'agent'],

  // ── Documents ──
  view_documents:          ['super_admin', 'admin', 'broker', 'agent', 'member'],
  manage_documents:        ['super_admin', 'admin', 'broker', 'agent'],
  delete_documents:        ['super_admin', 'admin'],

  // ── Reports & Analytics ──
  view_reports:            ['super_admin', 'admin', 'broker'],
  view_analytics:          ['super_admin', 'admin', 'broker'],

  // ── Notifications ──
  view_notifications:      ['super_admin', 'admin', 'broker', 'agent', 'member', 'viewer'],
  manage_notifications:    ['super_admin', 'admin'],

  // ── Workflows & Automations ──
  view_workflows:          ['super_admin', 'admin', 'broker'],
  manage_workflows:        ['super_admin', 'admin'],

  // ── Conversations / Inbox ──
  view_conversations:      ['super_admin', 'admin', 'broker', 'agent'],
  manage_conversations:    ['super_admin', 'admin', 'broker', 'agent'],

  // ── Social Planner ──
  view_social:             ['super_admin', 'admin', 'broker', 'agent'],
  manage_social:           ['super_admin', 'admin'],

  // ── Recruiting & Referrals ──
  view_recruiting:         ['super_admin', 'admin', 'broker'],
  manage_recruiting:       ['super_admin', 'admin'],
  view_referrals:          ['super_admin', 'admin', 'broker', 'agent'],
  manage_referrals:        ['super_admin', 'admin', 'broker'],

  // ── Media Library ──
  view_media:              ['super_admin', 'admin', 'broker', 'agent', 'member'],
  manage_media:            ['super_admin', 'admin', 'broker', 'agent'],
  delete_media:            ['super_admin', 'admin'],

  // ── Feature Marketplace ──
  view_marketplace:        ['super_admin', 'admin'],
  toggle_features:         ['super_admin', 'admin'],
  manage_billing:          ['super_admin'],

  // ── User Management ──
  manage_users:            ['super_admin', 'admin'],
  deactivate_users:        ['super_admin', 'admin'],
  change_user_roles:       ['super_admin', 'admin', 'broker'],  // cannot assign role >= own role (enforced at API)
  impersonate_user:        ['super_admin'],

  // ── Settings & Configuration ──
  manage_settings:         ['super_admin', 'admin'],
  manage_integrations:     ['super_admin'],
  manage_oauth:            ['super_admin'],

  // ── Audit & Security ──
  view_audit_log:          ['super_admin', 'admin'],
  export_audit_log:        ['super_admin'],

  // ── System / Developer ──
  system_admin:            ['super_admin'],
  developer_tools:         ['super_admin'],
  api_key_management:      ['super_admin'],
  view_system_health:      ['super_admin'],
  manage_webhooks:         ['super_admin'],
  access_raw_api:          ['super_admin'],
};

export type Permission = keyof typeof RBAC;

/** Permission categories — used by the Roles & Permissions settings UI.
 *  Keys are display group names; values are ordered permission keys. */
export const PERMISSION_CATEGORIES: Record<string, Permission[]> = {
  'CRM & Contacts':        ['view_crm', 'manage_crm', 'import_export_crm', 'delete_crm_records'],
  'Listings':              ['view_listings', 'manage_listings', 'delete_listings'],
  'Transactions':          ['view_transactions', 'manage_transactions', 'delete_transactions'],
  'Calendar':              ['view_calendar', 'manage_calendar'],
  'Inbox & Comms':         ['view_conversations', 'manage_conversations'],
  'Documents':             ['view_documents', 'manage_documents', 'delete_documents'],
  'Commission & Finance':  ['view_own_commission', 'view_all_commissions', 'manage_commissions'],
  'Reports & Analytics':   ['view_reports', 'view_analytics'],
  'Team Management':       ['view_team', 'manage_team', 'change_user_roles', 'manage_users', 'deactivate_users'],
  'Media & Social':        ['view_media', 'manage_media', 'delete_media', 'view_social', 'manage_social'],
  'Workflows':             ['view_workflows', 'manage_workflows'],
  'Recruiting':            ['view_recruiting', 'manage_recruiting', 'view_referrals', 'manage_referrals'],
  'Platform Admin':        ['manage_settings', 'manage_integrations', 'toggle_features', 'manage_billing', 'view_marketplace', 'view_audit_log', 'export_audit_log'],
  'System':                ['system_admin', 'developer_tools', 'api_key_management', 'view_system_health', 'manage_webhooks', 'access_raw_api', 'impersonate_user'],
};

/** Human-readable labels for permission keys */
export const PERMISSION_LABELS: Partial<Record<Permission, string>> = {
  view_crm: 'View CRM', manage_crm: 'Manage Contacts & Leads', import_export_crm: 'Import / Export CRM', delete_crm_records: 'Delete CRM Records',
  view_listings: 'View Listings', manage_listings: 'Manage Listings', delete_listings: 'Delete Listings',
  view_transactions: 'View Transactions', manage_transactions: 'Manage Transactions', delete_transactions: 'Delete Transactions',
  view_calendar: 'View Calendar', manage_calendar: 'Manage Team Calendar',
  view_conversations: 'View Inbox', manage_conversations: 'Manage Inbox',
  view_documents: 'View Documents', manage_documents: 'Manage Documents', delete_documents: 'Delete Documents',
  view_own_commission: 'View Own Commission', view_all_commissions: 'View All Commissions', manage_commissions: 'Manage Commissions',
  view_reports: 'View Reports', view_analytics: 'View Analytics',
  view_team: 'View Team', manage_team: 'Manage Team', change_user_roles: 'Change User Roles', manage_users: 'Manage Users', deactivate_users: 'Deactivate Users',
  view_media: 'View Media', manage_media: 'Manage Media', delete_media: 'Delete Media', view_social: 'View Social', manage_social: 'Manage Social',
  view_workflows: 'View Workflows', manage_workflows: 'Manage Workflows',
  view_recruiting: 'View Recruiting', manage_recruiting: 'Manage Recruiting', view_referrals: 'View Referrals', manage_referrals: 'Manage Referrals',
  manage_settings: 'Manage Settings', manage_integrations: 'Manage Integrations', toggle_features: 'Toggle Features', manage_billing: 'Manage Billing',
  view_marketplace: 'View Marketplace', view_audit_log: 'View Audit Log', export_audit_log: 'Export Audit Log',
  system_admin: 'System Admin', developer_tools: 'Developer Tools', api_key_management: 'API Key Management',
  view_system_health: 'System Health', manage_webhooks: 'Manage Webhooks', access_raw_api: 'Raw API Access', impersonate_user: 'Impersonate User',
};

/**
 * Check if a session has a given permission.
 *
 * Uses the flat `permissions[]` array baked into the session at login.
 * super_admin bypasses all checks as a safety net — they always have
 * every permission baked in anyway, but the early return prevents edge
 * cases if an old JWT lacks the `perms` claim.
 */
export function hasPermission(session: AuthSession, permission: Permission | string): boolean {
  if (session.role === 'super_admin') return true;
  return (session.permissions ?? []).includes(permission);
}

/** Check multiple permissions at once — returns true if ALL are granted */
export function hasAllPermissions(session: AuthSession, ...permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(session, p));
}

/** Check multiple permissions at once — returns true if ANY is granted */
export function hasAnyPermission(session: AuthSession, ...permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(session, p));
}

/** Get all permissions for the current session's role (sync — system roles only) */
export function getPermissionsForRole(role: Role | string): string[] {
  if (role === 'super_admin') {
    return Object.keys(RBAC);
  }
  if (!ROLES.includes(role as Role)) return []; // custom role — use async resolvePermissions
  return (Object.entries(RBAC) as [Permission, Role[]][])
    .filter(([, roles]) => roles.includes(role as Role))
    .map(([perm]) => perm);
}

// ─────────────────────────────────────────
// Auth model: Database-driven permissions.
// Google SSO only proves identity (verified email).
// The profiles table is the single source of truth
// for who can access the system and what role they have.
// Admin pre-registers users before they can sign in.
// ─────────────────────────────────────────
