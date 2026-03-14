import {
  LayoutDashboard, UtensilsCrossed, CalendarDays, Users,
  MessageSquare, DollarSign, HardDrive, Globe, Settings,
  ClipboardList, type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@/lib/auth';
import { hasPermission } from '@/lib/auth';
import type { AuthSession } from '@/lib/auth';

export interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  exact?: boolean;
  requiredPermission?: Permission;
}

/**
 * Hospitality vertical nav — module IDs are universal, labels are restaurant-specific.
 * entities   → Menu
 * pipeline   → Bookings
 * crm        → Guests
 * calendar   → Calendar
 * inbox      → Inbox
 * finance    → Revenue
 * vault      → Storage
 * presence   → Website
 */
const MODULE_NAV: Record<string, NavItem[]> = {
  _always:  [{ href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard, exact: true }],
  entities: [{ href: '/menu',      label: 'Menu',      Icon: UtensilsCrossed, requiredPermission: 'view_listings' }],
  pipeline: [{ href: '/bookings',  label: 'Bookings',  Icon: ClipboardList,   requiredPermission: 'view_transactions' }],
  crm:      [
    { href: '/guests',   label: 'Guests',  Icon: Users,      requiredPermission: 'view_crm' },
  ],
  calendar: [{ href: '/calendar',  label: 'Calendar',  Icon: CalendarDays,    requiredPermission: 'view_calendar' }],
  inbox:    [{ href: '/inbox',     label: 'Inbox',     Icon: MessageSquare,   requiredPermission: 'view_conversations' }],
  finance:  [{ href: '/revenue',   label: 'Revenue',   Icon: DollarSign,      requiredPermission: 'view_own_commission' }],
  vault:    [{ href: '/storage',   label: 'Storage',   Icon: HardDrive,       requiredPermission: 'view_documents' }],
  presence: [{ href: '/website',   label: 'Website',   Icon: Globe,           requiredPermission: 'view_listings' }],
};

export function getNavForModules(
  activeModules: string[],
  session?: Pick<AuthSession, 'role' | 'permissions'> | null
): NavItem[] {
  const items: NavItem[] = [...(MODULE_NAV['_always'] ?? [])];
  for (const moduleId of activeModules) {
    items.push(...(MODULE_NAV[moduleId] ?? []));
  }
  if (!session) return items;
  return items.filter(item =>
    !item.requiredPermission || hasPermission(session as AuthSession, item.requiredPermission)
  );
}
