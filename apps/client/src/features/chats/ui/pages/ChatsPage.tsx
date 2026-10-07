import { MessageSquare } from 'lucide-react';
import React from 'react';
import { PageHeader } from '@/shared/ui/components/PageHeader';
import { PageShell } from '@/shared/ui/components/PageShell';

/** Placeholder hasta la épica de Chats (`.scratch/whatsapp-chats/PLAN.md`). */
export function ChatsPage(): React.JSX.Element {
  return (
    <PageShell>
      <PageHeader
        subtitulo="Conversaciones de WhatsApp con los clientes de Saba."
        titulo="Chats"
      />
      <div className="rounded-lg border border-dashed px-5 py-16 text-center text-muted-foreground">
        <MessageSquare
          aria-hidden="true"
          className="mx-auto mb-3 size-10 opacity-40"
        />
        <p className="font-semibold text-foreground text-sm">Próximamente</p>
        <p className="mt-1 text-sm">
          Acá vas a poder responder los mensajes de WhatsApp de Saba.
        </p>
      </div>
    </PageShell>
  );
}
