'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UtensilsCrossed, ClipboardList, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface DashboardStats {
  menu: { total: number; available: number; unavailable: number; categories: number };
  bookings: number;
  guests: number;
}

function StatCard({
  label, value, sub, icon: Icon, href, accentColor,
}: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; href: string; accentColor: string;
}) {
  return (
    <Link href={href} className="group block rounded-xl border p-5 transition-all hover:shadow-md
      bg-[var(--card-bg)] border-[var(--card-border)] hover:border-[var(--accent)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--muted)]">{label}</p>
          <p className="mt-1.5 text-3xl font-bold tabular-nums" style={{ color: accentColor }}>{value}</p>
          {sub && <p className="mt-1 text-xs text-[var(--muted)]">{sub}</p>}
        </div>
        <div className="rounded-lg p-2.5 mt-0.5" style={{ background: `${accentColor}18` }}>
          <Icon className="w-5 h-5" style={{ color: accentColor }} />
        </div>
      </div>
    </Link>
  );
}

export default function DashboardHome() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-playfair, 'Playfair Display', serif)" }}>
          Welcome back
        </h1>
        <p className="text-sm mt-1 text-[var(--muted)]">Here&apos;s what&apos;s happening at Crazy Tadka today.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border p-5 h-28 animate-pulse bg-[var(--card-bg)] border-[var(--card-border)]" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Menu Items" value={stats.menu.total}
            sub={`${stats.menu.categories} categories`}
            icon={UtensilsCrossed} href="/menu" accentColor="#E63946"
          />
          <StatCard
            label="Available" value={stats.menu.available}
            sub={`${stats.menu.unavailable} unavailable`}
            icon={CheckCircle} href="/menu?status=available" accentColor="#2a9d8f"
          />
          <StatCard
            label="Bookings" value={stats.bookings}
            icon={ClipboardList} href="/bookings" accentColor="#F4A261"
          />
          <StatCard
            label="Guests" value={stats.guests}
            icon={Users} href="/guests" accentColor="#6366f1"
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--muted)]">Could not load stats.</p>
      )}

      {/* Quick actions */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-3">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/menu?add=1"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: '#E63946' }}>
            <UtensilsCrossed className="w-4 h-4" />
            Add menu item
          </Link>
          <Link href="/bookings?add=1"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
            border-[var(--card-border)] text-[var(--text)] hover:border-[var(--accent)]">
            <ClipboardList className="w-4 h-4" />
            New booking
          </Link>
          <Link href="/guests?add=1"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors
            border-[var(--card-border)] text-[var(--text)] hover:border-[var(--accent)]">
            <Users className="w-4 h-4" />
            Add guest
          </Link>
        </div>
      </div>
    </div>
  );
}
