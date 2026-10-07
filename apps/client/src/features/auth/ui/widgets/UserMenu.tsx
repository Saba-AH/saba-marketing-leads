'use client';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@repo/ui/components/sidebar';
import { LogOut } from 'lucide-react';
import React from 'react';
import { recargarEn } from '@/lib/session/recargarEn';
import { useCerrarSesion } from '../../application/mutations/useCerrarSesion.mutation';
import { useUsuarioSesion } from '../../application/queries/useUsuarioSesion.query';
import { etiquetaRol, iniciales } from '../../domain/usuarioSesion.model';

/** Pie del sidebar: quién tiene la sesión y el botón para cerrarla. */
export function UserMenu(): React.JSX.Element {
  const usuario = useUsuarioSesion();
  const cerrarSesion = useCerrarSesion();

  function salir(): void {
    cerrarSesion.mutate(undefined, {
      onSettled: () => recargarEn('/login'),
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {usuario.data ? (
          // `asChild` + `div`: muestra quién es, no es una acción.
          <SidebarMenuButton
            asChild
            className="cursor-default hover:bg-transparent active:bg-transparent"
            size="lg"
            tooltip={`${usuario.data.nombre} · ${etiquetaRol(usuario.data.rol)}`}
          >
            <div>
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-bold text-sidebar-primary-foreground text-xs"
              >
                {iniciales(usuario.data.nombre)}
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-semibold text-sidebar-accent-foreground">
                  {usuario.data.nombre}
                </span>
                <span className="truncate text-xs">{usuario.data.correo}</span>
                <span className="truncate text-[11px]">
                  {etiquetaRol(usuario.data.rol)}
                </span>
              </span>
            </div>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuSkeleton showIcon />
        )}
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled={cerrarSesion.isPending}
          onClick={salir}
          tooltip="Cerrar sesión"
        >
          <LogOut />
          <span>Cerrar sesión</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
