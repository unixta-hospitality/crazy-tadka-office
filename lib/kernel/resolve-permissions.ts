/**
 * Resolve the full permission list for a user at login time.
 *
 * System roles  → static RBAC map (zero DB queries)
 * Custom roles  → DB lookup in tenant_custom_roles
 *
 * The result is baked into the JWT `perms` claim so every subsequent
 * request reads permissions from the token with zero DB overhead.
 */

import { ROLES, getPermissionsForRole, type Role } from '@/lib/auth';
import { createServiceClient } from '@/lib/db/server';

export async function resolvePermissions(
  role: string,
  tenantId: string,
): Promise<string[]> {
  // Fast path: system roles are resolved entirely from the static RBAC map
  if (ROLES.includes(role as Role)) {
    return getPermissionsForRole(role as Role);
  }

  // Custom role: look up permissions array stored in tenant_custom_roles
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('tenant_custom_roles')
      .select('permissions')
      .eq('tenant_id', tenantId)
      .eq('slug', role)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      console.warn(`[resolve-permissions] custom role "${role}" not found for tenant ${tenantId}`, error?.message);
      return [];
    }

    return Array.isArray(data.permissions) ? data.permissions : [];
  } catch (err) {
    console.error('[resolve-permissions] unexpected error', err);
    return [];
  }
}
