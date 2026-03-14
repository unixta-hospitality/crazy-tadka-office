'use client';

import { Menu } from 'lucide-react';
import { useSession } from '@/lib/hooks/use-session';
import ProfileDropdown from './ProfileDropdown';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const { user, loading } = useSession();

  const initials = user
    ? user.fullName
        .split(' ')
        .filter(Boolean)
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <header className="h-14 bg-card border-b border-border flex items-center px-4 gap-3 sticky top-0 z-10 shrink-0 backdrop-blur-md dark:bg-card/90">
      {/* Mobile hamburger */}
      <button
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors lg:hidden"
        onClick={onMenuToggle}
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-medium text-muted-foreground truncate">Office Portal</h1>
      </div>

      {/* Theme toggle */}
      <ThemeToggle />

      {/* Profile — only when session loaded */}
      {!loading && user && (
        <ProfileDropdown
          fullName={user.fullName}
          email={user.email}
          role={user.role}
          avatarUrl={user.avatarUrl}
          initials={initials}
        />
      )}
      {/* Skeleton while loading */}
      {loading && (
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="hidden sm:block space-y-1.5">
            <div className="h-2.5 w-24 rounded bg-muted animate-pulse" />
            <div className="h-2 w-16 rounded bg-muted animate-pulse" />
          </div>
        </div>
      )}
    </header>
  );
}
