'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, Settings } from 'lucide-react';
import { useModules } from '@/lib/hooks/use-modules';
import { useSession } from '@/lib/hooks/use-session';
import { getNavForModules } from '@/lib/kernel/nav';
import type { AuthSession } from '@/lib/auth';

interface SidebarProps { open: boolean; onClose: () => void; }

export default function Sidebar({ open, onClose }: SidebarProps) {
  const path = usePathname();
  const { modules, loading: modulesLoading } = useModules();
  const { user, loading: sessionLoading } = useSession();
  const loading = modulesLoading || sessionLoading;

  const navItems = getNavForModules(
    modules,
    loading ? null : user ? { role: user.role as AuthSession['role'], permissions: user.permissions } : null,
  );

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside className={[
        'fixed inset-y-0 left-0 z-30 w-64 flex flex-col',
        'border-r transition-transform duration-200 ease-in-out',
        'bg-[var(--sidebar-bg)] border-[var(--sidebar-border)]',
        open ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
      ].join(' ')}>
        <div className="h-14 flex items-center justify-between px-5 shrink-0 border-b border-[var(--sidebar-border)]">
          <span className="text-base font-semibold tracking-wide"
            style={{ fontFamily: "var(--font-playfair, 'Playfair Display', Georgia, serif)", color: 'var(--accent)' }}>
            Crazy Tadka
          </span>
          <button className="p-1.5 rounded-md transition-colors text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] lg:hidden"
            onClick={onClose} aria-label="Close navigation">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {loading ? (
            <div className="space-y-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 rounded-lg bg-[var(--sidebar-hover-bg)] animate-pulse" />
              ))}
            </div>
          ) : navItems.map(({ href, label, Icon, exact }) => {
            const active = exact ? path === href : path.startsWith(href);
            return (
              <Link key={href} href={href} onClick={onClose}
                className={['flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                  active ? 'border-l-2' : 'border-l-2 border-transparent'].join(' ')}
                style={active ? {
                  background: 'var(--sidebar-active-bg)', color: 'var(--sidebar-active-text)',
                  borderLeftColor: 'var(--sidebar-active-text)', paddingLeft: '10px',
                } : { color: 'var(--sidebar-text)' }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = ''; }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Settings */}
        <div className="shrink-0 border-t border-[var(--sidebar-border)] p-3">
          <Link href="/settings" onClick={onClose}
            className={['flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              path.startsWith('/settings') ? 'border-l-2' : 'border-l-2 border-transparent'].join(' ')}
            style={path.startsWith('/settings') ? {
              background: 'var(--sidebar-active-bg)', color: 'var(--sidebar-active-text)',
              borderLeftColor: 'var(--sidebar-active-text)', paddingLeft: '10px',
            } : { color: 'var(--sidebar-text)' }}
            onMouseEnter={(e) => { if (!path.startsWith('/settings')) e.currentTarget.style.background = 'var(--sidebar-hover-bg)'; }}
            onMouseLeave={(e) => { if (!path.startsWith('/settings')) e.currentTarget.style.background = ''; }}
          >
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </Link>
        </div>
      </aside>
    </>
  );
}
