import { LayoutDashboard, type LucideIcon, MessageSquare } from 'lucide-react';

export interface ItemNavegacion {
  etiqueta: string;
  href: string;
  icono: LucideIcon;
}

export interface GrupoNavegacion {
  etiqueta: string;
  items: ItemNavegacion[];
}

/** Menú del panel. Un ítem nuevo se agrega acá, no en el componente. */
export const NAVEGACION: GrupoNavegacion[] = [
  {
    etiqueta: 'General',
    items: [
      { etiqueta: 'Inicio', href: '/', icono: LayoutDashboard },
      { etiqueta: 'Chats', href: '/chats', icono: MessageSquare },
    ],
  },
];

/** `/chats/123` sigue marcando "Chats"; `/` solo se marca a sí mismo. */
export function estaActivo(href: string, pathname: string): boolean {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(`${href}/`);
}
