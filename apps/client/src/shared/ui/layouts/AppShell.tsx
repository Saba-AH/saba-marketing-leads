'use client';

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@repo/ui/components/sidebar';
import React from 'react';
import { AppSidebar } from './AppSidebar';

/**
 * Marco de las pantallas con sesión. `defaultOpen` sale de la cookie
 * `sidebar_state` que lee el layout en el servidor: así el HTML llega con el
 * sidebar en el estado correcto y no salta al hidratar.
 */
export function AppShell({
  defaultOpen,
  pieSidebar,
  children,
}: {
  defaultOpen: boolean;
  pieSidebar?: React.ReactNode;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar pie={pieSidebar} />
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center border-b px-3">
          <SidebarTrigger aria-label="Mostrar u ocultar el menú" />
        </header>
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
