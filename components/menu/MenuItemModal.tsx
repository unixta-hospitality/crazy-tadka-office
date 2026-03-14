'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface Category { id: string; name: string; slug: string; }
interface MenuItem {
  id: string; name: string; status: string; slug: string;
  metadata: { price: number; is_veg: boolean; is_special: boolean; category_slug: string; category_id: string; subcategory?: string; description?: string; spicy_level?: 0|1|2|3; sort_order?: number; };
}

const SPICY_OPTIONS = [
  { value: '0', label: 'Not spicy' },
  { value: '1', label: 'Mild' },
  { value: '2', label: 'Medium' },
  { value: '3', label: 'Hot' },
];

export default function MenuItemModal({
  item, categories, onClose, onSaved,
}: {
  item: MenuItem | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName]               = useState(item?.name ?? '');
  const [price, setPrice]             = useState(String(item?.metadata.price ?? ''));
  const [isVeg, setIsVeg]             = useState(item?.metadata.is_veg ?? true);
  const [isSpecial, setIsSpecial]     = useState(item?.metadata.is_special ?? false);
  const [categoryId, setCategoryId]   = useState(item?.metadata.category_id ?? (categories[0]?.id ?? ''));
  const [subcategory, setSubcategory] = useState(item?.metadata.subcategory ?? '');
  const [description, setDescription] = useState(item?.metadata.description ?? '');
  const [spicyLevel, setSpicyLevel]   = useState(String(item?.metadata.spicy_level ?? '0'));

  const selectedCat = categories.find(c => c.id === categoryId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    if (!price || isNaN(Number(price)) || Number(price) < 0) { setError('Valid price is required'); return; }
    if (!categoryId) { setError('Category is required'); return; }

    setSaving(true);
    setError('');

    const body = {
      name: name.trim(),
      price: Number(price),
      is_veg: isVeg,
      is_special: isSpecial,
      category_slug: selectedCat?.slug ?? '',
      category_id: categoryId,
      subcategory: subcategory.trim() || undefined,
      description: description.trim() || undefined,
      spicy_level: Number(spicyLevel) as 0|1|2|3,
    };

    try {
      const res = await fetch(
        isEdit ? `/api/menu/items/${item.id}` : '/api/menu/items',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl shadow-xl bg-[var(--card-bg)] border border-[var(--card-border)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--card-border)] shrink-0">
          <h2 className="text-base font-semibold text-[var(--text)]">
            {isEdit ? 'Edit menu item' : 'Add menu item'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--sidebar-hover-bg)] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted)]">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              placeholder="e.g. Chicken Tikka Masala"
              className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text)] border-[var(--card-border)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]" />
          </div>

          {/* Price */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted)]">Price (₹) *</label>
            <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required
              placeholder="e.g. 249"
              className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text)] border-[var(--card-border)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]" />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted)]">Category *</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required
              className="w-full px-3 py-2 text-sm rounded-lg border bg-[var(--card-bg)] text-[var(--text)] border-[var(--card-border)] focus:outline-none focus:border-[var(--accent)]">
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Subcategory */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted)]">Subcategory</label>
            <input type="text" value={subcategory} onChange={e => setSubcategory(e.target.value)}
              placeholder="e.g. Chicken, Paneer"
              className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text)] border-[var(--card-border)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]" />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted)]">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              placeholder="Short description visible to customers"
              className="w-full px-3 py-2 text-sm rounded-lg border bg-transparent text-[var(--text)] border-[var(--card-border)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] resize-none" />
          </div>

          {/* Spice level */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--muted)]">Spice level</label>
            <select value={spicyLevel} onChange={e => setSpicyLevel(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border bg-[var(--card-bg)] text-[var(--text)] border-[var(--card-border)] focus:outline-none focus:border-[var(--accent)]">
              {SPICY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Veg & Special toggles */}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isVeg} onChange={e => setIsVeg(e.target.checked)}
                className="w-4 h-4 accent-green-500" />
              <span className="text-sm text-[var(--text)]">Vegetarian</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={isSpecial} onChange={e => setIsSpecial(e.target.checked)}
                className="w-4 h-4 accent-amber-400" />
              <span className="text-sm text-[var(--text)]">Chef&apos;s special</span>
            </label>
          </div>

          {error && <p className="text-xs text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>}
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--card-border)] flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-[var(--card-border)] text-[var(--text)] hover:bg-[var(--sidebar-hover-bg)] transition-colors">
            Cancel
          </button>
          <button type="submit" form="menu-modal-form" disabled={saving}
            onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-opacity hover:opacity-90"
            style={{ background: 'var(--accent, #E63946)' }}>
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Save changes' : 'Add item'}
          </button>
        </div>
      </div>
    </div>
  );
}
