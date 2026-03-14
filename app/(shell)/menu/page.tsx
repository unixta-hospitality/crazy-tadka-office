'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Search, SlidersHorizontal, UtensilsCrossed } from 'lucide-react';
import MenuItemCard from '@/components/menu/MenuItemCard';
import MenuItemModal from '@/components/menu/MenuItemModal';
import EmptyState from '@/components/shared/EmptyState';

interface Category { id: string; name: string; slug: string; metadata: Record<string, unknown>; }
interface MenuItem {
  id: string; name: string; status: string; slug: string;
  metadata: { price: number; is_veg: boolean; is_special: boolean; category_slug: string; category_id: string; subcategory?: string; description?: string; spicy_level?: 0|1|2|3; sort_order?: number; };
}

function MenuPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(searchParams.get('category_slug') ?? '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [vegFilter, setVegFilter] = useState(searchParams.get('is_veg') ?? '');
  const [modalOpen, setModalOpen] = useState(!!searchParams.get('add'));
  const [editItem, setEditItem] = useState<MenuItem | null>(null);

  // Load categories once
  useEffect(() => {
    fetch('/api/menu/categories')
      .then(r => r.json())
      .then(d => Array.isArray(d) ? setCategories(d) : null)
      .catch(() => null);
  }, []);

  // Load items when filters change
  const loadItems = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (catFilter)    params.set('category_slug', catFilter);
    if (statusFilter) params.set('status', statusFilter);
    if (vegFilter)    params.set('is_veg', vegFilter);
    if (search)       params.set('q', search);
    params.set('limit', '200');

    fetch(`/api/menu/items?${params}`)
      .then(r => r.json())
      .then(d => { setItems(Array.isArray(d) ? d : (d.items ?? [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, [catFilter, statusFilter, vegFilter, search]);

  useEffect(() => { loadItems(); }, [loadItems]);

  async function handleToggle(id: string, available: boolean) {
    await fetch(`/api/menu/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'toggle_availability', available }),
    });
    loadItems();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this menu item?')) return;
    await fetch(`/api/menu/items/${id}`, { method: 'DELETE' });
    loadItems();
  }

  function openAdd() { setEditItem(null); setModalOpen(true); }
  function openEdit(item: MenuItem) { setEditItem(item); setModalOpen(true); }
  function closeModal() { setModalOpen(false); setEditItem(null); }
  function onSaved() { closeModal(); loadItems(); }

  // Group items by category for display
  const grouped: Record<string, MenuItem[]> = {};
  for (const item of items) {
    const cat = item.metadata?.category_slug ?? 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  }
  const catOrder = categories.map(c => c.slug);
  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const ai = catOrder.indexOf(a), bi = catOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  const showGrouped = !catFilter && !search;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
            Menu
          </h1>
          <p className="text-sm mt-0.5 text-[var(--muted)]">
            {loading ? 'Loading…' : `${items.length} items${catFilter ? '' : ` across ${categories.length} categories`}`}
          </p>
        </div>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90 transition-opacity"
          style={{ background: 'var(--accent, #E63946)' }}>
          <Plus className="w-4 h-4" />
          Add item
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted)]" />
          <input
            type="text" placeholder="Search items…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        {/* Category filter */}
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]">
          <option value="">All categories</option>
          {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
        </select>

        {/* Status filter */}
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]">
          <option value="">All status</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>

        {/* Veg filter */}
        <select value={vegFilter} onChange={e => setVegFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border bg-[var(--card-bg)] border-[var(--card-border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]">
          <option value="">Veg & Non-veg</option>
          <option value="true">Veg only</option>
          <option value="false">Non-veg only</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl border animate-pulse bg-[var(--card-bg)] border-[var(--card-border)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed className="w-7 h-7" />} title="No menu items" description="Add your first menu item to get started." action={<button onClick={openAdd} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--accent, #E63946)' }}>Add item</button>} />
      ) : showGrouped ? (
        // Grouped by category
        <div className="space-y-8">
          {sortedGroups.map(([catSlug, catItems]) => {
            const catName = categories.find(c => c.slug === catSlug)?.name ?? catSlug;
            return (
              <section key={catSlug}>
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-base font-semibold text-[var(--text)]">{catName}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--muted)]">{catItems.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {catItems.map(item => (
                    <MenuItemCard key={item.id} item={item} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        // Flat list when filtering
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <MenuItemCard key={item.id} item={item} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {modalOpen && (
        <MenuItemModal
          item={editItem}
          categories={categories}
          onClose={closeModal}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[var(--muted)] text-sm">Loading…</div>}>
      <MenuPageInner />
    </Suspense>
  );
}
