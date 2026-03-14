import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromApiRequest, hasPermission } from '@/lib/auth';
import { sanitizeError } from '@/lib/sanitize-error';
import { getMenuItem, updateMenuItem, deleteMenuItem, toggleAvailability } from '@/lib/modules/menu';

type Params = { params: { id: string } };

// GET /api/menu/items/:id
export async function GET(request: NextRequest, { params }: Params) {
  const session = await getSessionFromApiRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const item = await getMenuItem(params.id);
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

// PATCH /api/menu/items/:id — update or toggle availability
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSessionFromApiRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'manage_listings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  try {
    // Special action: toggle availability
    if (body.action === 'toggle_availability' && typeof body.available === 'boolean') {
      const item = await toggleAvailability(params.id, body.available);
      return NextResponse.json(item);
    }

    // General field update
    const { name, price, is_veg, is_special, subcategory, description, spicy_level, sort_order } = body;
    const item = await updateMenuItem(params.id, {
      name:        name        !== undefined ? String(name)        : undefined,
      price:       price       !== undefined ? Number(price)       : undefined,
      is_veg:      is_veg      !== undefined ? Boolean(is_veg)     : undefined,
      is_special:  is_special  !== undefined ? Boolean(is_special) : undefined,
      subcategory: subcategory !== undefined ? String(subcategory) : undefined,
      description: description !== undefined ? String(description) : undefined,
      spicy_level: spicy_level as 0 | 1 | 2 | 3 | undefined,
      sort_order:  sort_order  !== undefined ? Number(sort_order)  : undefined,
    });
    return NextResponse.json(item);
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}

// DELETE /api/menu/items/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const session = await getSessionFromApiRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!hasPermission(session, 'manage_listings')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await deleteMenuItem(params.id);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
