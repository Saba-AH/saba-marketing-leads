import { LayoutDashboard, type LucideIcon, MessageSquare } from 'lucide-react';

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

/** The panel's menu. A new item is added here, not in the component. */
export const NAVIGATION: NavigationGroup[] = [
  {
    label: 'General',
    items: [
      { label: 'Inicio', href: '/', icon: LayoutDashboard },
      { label: 'Chats', href: '/chats', icon: MessageSquare },
    ],
  },
];

/** `/chats/123` still highlights "Chats"; `/` only highlights itself. */
export function isNavItemActive(href: string, pathname: string): boolean {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(`${href}/`);
}
