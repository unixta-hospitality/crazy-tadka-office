import { serverClient } from '@/lib/db/server';
import { getTenant } from '@/lib/kernel';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuCategory {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  metadata: {
    slug: string;
    emoji: string;
    description: string;
    sort_order: number;
  };
  created_at: string;
  updated_at: string;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listMenuCategories(): Promise<MenuCategory[]> {
  const tenant = await getTenant();
  const supabase = serverClient();
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('type', 'menu_category')
    .eq('status', 'active')
    .order('metadata->>sort_order');
  if (error) throw error;
  return (data ?? []) as MenuCategory[];
}
