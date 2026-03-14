'use client';

import { Pencil, Trash2, Flame, Leaf, Star } from 'lucide-react';

interface MenuItem {
  id: string; name: string; status: string; slug: string;
  metadata: { price: number; is_veg: boolean; is_special: boolean; category_slug: string; category_id: string; subcategory?: string; description?: string; spicy_level?: 0|1|2|3; sort_order?: number; };
}

const SPICY_LABELS = ['', 'Mild', 'Medium', 'Hot'];

export default function MenuItemCard({
  item, onEdit, onToggle, onDelete,
}: {
  item: MenuItem;
  onEdit: (item: MenuItem) => void;
  onToggle: (id: string, available: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const { price, is_veg, is_special, subcategory, description, spicy_level } = item.metadata;
  const available = item.status === 'available';

  return (
    <div className={[
      'group relative rounded-xl border p-4 flex flex-col gap-2 transition-all',
      'bg-[var(--card-bg)] border-[var(--card-border)]',
      !available && 'opacity-60',
    ].filter(Boolean).join(' ')}>
      {/* Top row: name + action buttons */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Veg indicator */}
            <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 ${is_veg ? 'border-green-500' : 'border-red-500'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${is_veg ? 'bg-green-500' : 'bg-red-500'}`} />
            </span>
            <span className="text-sm font-semibold text-[var(--text)] truncate">{item.name}</span>
            {is_special && <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />}
          </div>
          {subcategory && <p className="text-xs text-[var(--muted)] mt-0.5">{subcategory}</p>}
        </div>
        {/* Edit / Delete on hover */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(item)}
            className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--sidebar-hover-bg)] transition-colors"
            title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-md text-[var(--muted)] hover:text-red-500 hover:bg-[var(--sidebar-hover-bg)] transition-colors"
            title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Description */}
      {description && <p className="text-xs text-[var(--muted)] line-clamp-2">{description}</p>}

      {/* Bottom row: price + spicy + availability toggle */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold" style={{ color: 'var(--accent, #E63946)' }}>₹{price}</span>
          {spicy_level ? (
            <span className="flex items-center gap-0.5 text-xs text-orange-500">
              <Flame className="w-3 h-3" />
              {SPICY_LABELS[spicy_level]}
            </span>
          ) : null}
        </div>

        {/* Availability toggle */}
        <button onClick={() => onToggle(item.id, !available)}
          className={[
            'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
            'transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-1',
            available ? 'bg-green-500' : 'bg-[var(--card-border)]',
          ].join(' ')}
          title={available ? 'Mark unavailable' : 'Mark available'}
          role="switch" aria-checked={available}>
          <span className={[
            'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            available ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')} />
        </button>
      </div>
    </div>
  );
}
