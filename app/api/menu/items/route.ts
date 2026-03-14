import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromApiRequest, hasPermission } from '@/lib/auth';
import { sanitizeError } from '@/lib/sanitize-error';
import { listMenuItems, createMenuItem } from '@/lib/modules/menu';
import { listMenuCategories } from '@/lib/modules/menu';

// GET /api/menu/items?category_slug=starters&status=available&is_veg=true&q=paneer
export async function GET(request: NextRequest) {
  const session = await getSessionFromApiRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  try {
    const result = await listMenuItems({
      category_slug: searchParams.get('category_slug') ?? undefined,
      status:        searchParams.get('status')        ?? undefined,
      is_veg:        searchParams.has('is_veg') ? searchParams.get('is_veg') === 'true' : undefined,
      is_special:    searchParams.get('is_special') === 'true' || undefined,
      q:             searchParams.get('q')            ?? undefined,
      limit:  parseInt(searchParams.get('limit')  ?? '200', 10),
      offset: parseInt(searchParams.get('offset') ?? '0',   10),
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

// POST /api/menu/items — create a new menu item
export async function POST(request: NextRequest) {
  const session = await getSessionFromApiRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'manage_listings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, price, is_veg, is_special, category_slug, category_id, subcategory, description, spicy_level } = body;
  if (!name || price === undefined || !category_slug || !category_id) {
    return NextResponse.json({ error: 'name, price, category_slug, category_id are required' }, { status: 400 });
  }

  try {
    const item = await createMenuItem({
      name: String(name),
      price: Number(price),
      is_veg: Boolean(is_veg),
      is_special: Boolean(is_special),
      category_slug: String(category_slug),
      category_id: String(category_id),
      subcategory: subcategory ? String(subcategory) : undefined,
      description: description ? String(description) : undefined,
      spicy_level: spicy_level as 0 | 1 | 2 | 3 | undefined,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
