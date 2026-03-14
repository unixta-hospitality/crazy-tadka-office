import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromApiRequest } from '@/lib/auth';
import { sanitizeError } from '@/lib/sanitize-error';
import { listMenuCategories } from '@/lib/modules/menu';

// GET /api/menu/categories
export async function GET(request: NextRequest) {
  const session = await getSessionFromApiRequest(request);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const categories = await listMenuCategories();
    return NextResponse.json(categories);
  } catch (err) {
    return NextResponse.json({ error: sanitizeError(err) }, { status: 500 });
  }
}
