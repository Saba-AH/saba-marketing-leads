'use client';

import { Button } from '@repo/ui/components/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/components/sheet';
import { X } from 'lucide-react';
import React from 'react';
import type { Conversation } from '../../domain/chat.model';
import { useIsWideScreen } from '../hooks/useIsWideScreen';
import { SabaCustomerPanel } from './SabaCustomerPanel';

const TITLE = 'Info. del contacto';

/** Like WhatsApp Web: next to the thread on wide screens, sliding on the others. */
export function ContactDetail({
  conversation,
  isOpen,
  onClose,
}: {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}): React.JSX.Element | null {
  const wide = useIsWideScreen();

  if (!wide) {
    return (
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{TITLE}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col px-4 pb-4">
            <SabaCustomerPanel conversation={conversation} />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!isOpen) return null;
  return (
    <aside
      aria-label={TITLE}
      className="flex w-80 shrink-0 flex-col overflow-y-auto border-l"
    >
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar el detalle"
          onClick={onClose}
        >
          <X aria-hidden="true" />
        </Button>
        <h2 className="font-semibold">{TITLE}</h2>
      </header>
      <div className="flex flex-1 flex-col p-4">
        <SabaCustomerPanel conversation={conversation} />
      </div>
    </aside>
  );
}
