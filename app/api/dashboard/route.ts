import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromApiRequest } from '@/lib/auth';
import { sanitizeError } from '@/lib/sanitize-error';
import { serverClient } from '@/lib/db/server';
import { getTenant } from '@/lib/kernel';

// GET /api/dashboard — summary stats for crazy-tadka office home
export async function GET(request: NextRequest) {
  const session = await getSessionFromApiRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const tenant = await getTenant();
    const sb = serverClient();

    const [menuItemsRes, categoriesRes, bookedRes, guestsRes] = await Promise.all([
      sb.from('entities').select('id,status', { count: 'exact', head: false })
        .eq('tenant_id', tenant.id).eq('type', 'menu_item'),
      sb.from('entities').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id).eq('type', 'menu_category'),
      sb.from('pipeline_items').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id),
      sb.from('contacts').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id),
    ]);

    const items = menuItemsRes.data ?? [];
    const available   = items.filter(i => i.status === 'available').length;
    const unavailable = items.filter(i => i.status === 'unavailable').length;

    return NextResponse.json({
      menu: {
        total:       menuItemsRes.count ?? 0,
        available,
        unavailable,
        categories:  categoriesRes.count ?? 0,
      },
      bookings: bookedRes.count ?? 0,
      guests:   guestsRes.count ?? 0,
    });
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
