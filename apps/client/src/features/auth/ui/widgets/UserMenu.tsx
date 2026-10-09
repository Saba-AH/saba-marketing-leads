'use client';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from '@repo/ui/components/sidebar';
import { LogOut } from 'lucide-react';
import React from 'react';
import { reloadIn } from '@/lib/session/reloadIn';
import { useLogout } from '../../application/mutations/useLogout.mutation';
import { useSessionUser } from '../../application/queries/useSessionUser.query';
import { initials, roleLabel } from '../../domain/sessionUser.model';

/** Sidebar footer: who holds the session and the button to end it. */
export function UserMenu(): React.JSX.Element {
  const user = useSessionUser();
  const logout = useLogout();

  function exit(): void {
    logout.mutate(undefined, {
      onSettled: () => reloadIn('/login'),
    });
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {user.data ? (
          // `asChild` + `div`: it shows who you are, it is not an action.
          <SidebarMenuButton
            asChild
            className="cursor-default hover:bg-transparent active:bg-transparent"
            size="lg"
            tooltip={`${user.data.name} · ${roleLabel(user.data.role)}`}
          >
            <div>
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-bold text-sidebar-primary-foreground text-xs"
              >
                {initials(user.data.name)}
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate font-semibold text-sidebar-accent-foreground">
                  {user.data.name}
                </span>
                <span className="truncate text-xs">{user.data.email}</span>
                <span className="truncate text-[11px]">
                  {roleLabel(user.data.role)}
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
          disabled={logout.isPending}
          onClick={exit}
          tooltip="Cerrar sesión"
        >
          <LogOut />
          <span>Cerrar sesión</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
