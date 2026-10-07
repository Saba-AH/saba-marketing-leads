'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@repo/ui/components/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { estaActivo, NAVEGACION } from './navegacion';

/**
 * Sidebar del panel: logo, navegación y, abajo, lo que reciba en `pie` (el
 * menú de usuario, que vive en la feature de auth: `shared` no importa
 * features).
 */
export function AppSidebar({
  pie,
}: {
  pie?: React.ReactNode;
}): React.JSX.Element {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          aria-label="Saba Marketing Leads — inicio"
          className="flex h-10 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          href="/"
        >
          <img
            alt="Saba"
            className="h-6 w-auto group-data-[collapsible=icon]:hidden"
            height={305}
            src="/logos/logo.png"
            width={1017}
          />
          <img
            alt="Saba"
            className="hidden size-7 group-data-[collapsible=icon]:block"
            height={305}
            src="/logos/iso.png"
            width={305}
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {NAVEGACION.map((grupo) => (
          <SidebarGroup key={grupo.etiqueta}>
            <SidebarGroupLabel>{grupo.etiqueta}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {grupo.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={estaActivo(item.href, pathname)}
                      tooltip={item.etiqueta}
                    >
                      <Link
                        href={item.href}
                        onClick={() => isMobile && setOpenMobile(false)}
                      >
                        <item.icono />
                        <span>{item.etiqueta}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {pie && <SidebarFooter>{pie}</SidebarFooter>}
      <SidebarRail />
    </Sidebar>
  );
}
