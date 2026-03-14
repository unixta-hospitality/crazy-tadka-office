import { serverClient } from '@/lib/db/server';
import { getTenant, emitEvent } from '@/lib/kernel';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  tenant_id: string;
  name: string;
  /** 'available' | 'unavailable' | 'seasonal' */
  status: string;
  metadata: {
    price: number;
    is_veg: boolean;
    is_special: boolean;
    category_slug: string;
    category_id: string;
    subcategory: string;
    sort_order: number;
    description?: string;
    image_url?: string;
    spicy_level?: 0 | 1 | 2 | 3;
  };
  created_at: string;
  updated_at: string;
}

export interface MenuItemInput {
  name: string;
  status?: string;
  price: number;
  is_veg: boolean;
  is_special?: boolean;
  category_slug: string;
  category_id: string;
  subcategory?: string;
  description?: string;
  image_url?: string;
  spicy_level?: 0 | 1 | 2 | 3;
}

export interface ListMenuOptions {
  category_slug?: string;
  status?: string;
  is_veg?: boolean;
  is_special?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function listMenuItems(
  opts: ListMenuOptions = {}
): Promise<{ items: MenuItem[]; total: number }> {
  const tenant = await getTenant();
  const supabase = serverClient();
  const limit = Math.min(opts.limit ?? 100, 500);
  const offset = opts.offset ?? 0;

  let query = supabase
    .from('entities')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenant.id)
    .eq('type', 'menu_item');

  if (opts.status) query = query.eq('status', opts.status);
  if (opts.category_slug) query = query.eq('metadata->>category_slug', opts.category_slug);
  if (opts.is_veg !== undefined) query = query.eq('metadata->>is_veg', String(opts.is_veg));
  if (opts.is_special) query = query.eq('metadata->>is_special', 'true');
  if (opts.q) {
    const safe = opts.q.replace(/[%_]/g, '\\$&');
    query = query.ilike('name', `%${safe}%`);
  }

  const { data, count, error } = await query
    .order('metadata->>sort_order')
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { items: (data ?? []) as MenuItem[], total: count ?? 0 };
}

export async function getMenuItem(id: string): Promise<MenuItem | null> {
  const tenant = await getTenant();
  const supabase = serverClient();
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .eq('type', 'menu_item')
    .maybeSingle();
  if (error) throw error;
  return data as MenuItem | null;
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createMenuItem(input: MenuItemInput): Promise<MenuItem> {
  const tenant = await getTenant();
  const supabase = serverClient();

  const { data, error } = await supabase
    .from('entities')
    .insert({
      tenant_id: tenant.id,
      type: 'menu_item',
      name: input.name,
      status: input.status ?? 'available',
      metadata: {
        price: input.price,
        is_veg: input.is_veg,
        is_special: input.is_special ?? false,
        category_slug: input.category_slug,
        category_id: input.category_id,
        subcategory: input.subcategory ?? '',
        description: input.description,
        image_url: input.image_url,
        spicy_level: input.spicy_level ?? 0,
      },
    })
    .select()
    .single();

  if (error) throw error;

  await emitEvent(tenant.id, 'entities', 'menu_item.created', {
    item_id: data.id,
    name: data.name,
    price: input.price,
    category: input.category_slug,
  });

  return data as MenuItem;
}

export async function updateMenuItem(
  id: string,
  input: Partial<MenuItemInput & { status: string }>
): Promise<MenuItem> {
  const tenant = await getTenant();
  const supabase = serverClient();

  // Fetch current to merge metadata
  const current = await getMenuItem(id);
  if (!current) throw new Error(`Menu item ${id} not found`);

  const updatedMeta = {
    ...current.metadata,
    ...(input.price !== undefined      && { price: input.price }),
    ...(input.is_veg !== undefined     && { is_veg: input.is_veg }),
    ...(input.is_special !== undefined && { is_special: input.is_special }),
    ...(input.category_slug            && { category_slug: input.category_slug }),
    ...(input.category_id              && { category_id: input.category_id }),
    ...(input.subcategory !== undefined && { subcategory: input.subcategory }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.image_url !== undefined  && { image_url: input.image_url }),
    ...(input.spicy_level !== undefined && { spicy_level: input.spicy_level }),
  };

  const { data, error } = await supabase
    .from('entities')
    .update({
      ...(input.name   && { name: input.name }),
      ...(input.status && { status: input.status }),
      metadata: updatedMeta,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .select()
    .single();

  if (error) throw error;

  await emitEvent(tenant.id, 'entities', 'menu_item.updated', {
    item_id: id,
    changes: Object.keys(input),
  });

  return data as MenuItem;
}

export async function toggleAvailability(id: string, available: boolean): Promise<MenuItem> {
  const tenant = await getTenant();
  const supabase = serverClient();

  const { data, error } = await supabase
    .from('entities')
    .update({ status: available ? 'available' : 'unavailable', updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenant.id)
    .select()
    .single();

  if (error) throw error;

  await emitEvent(tenant.id, 'entities', 'menu_item.availability_changed', {
    item_id: id,
    available,
  });

  return data as MenuItem;
}

export async function deleteMenuItem(id: string): Promise<void> {
  const tenant = await getTenant();
  const supabase = serverClient();
  const { error } = await supabase
    .from('entities')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenant.id);
  if (error) throw error;
}
