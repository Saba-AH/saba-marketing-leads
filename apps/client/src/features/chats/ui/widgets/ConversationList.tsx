'use client';

import { Skeleton } from '@repo/ui/components/skeleton';
import React from 'react';
import { EmptyState } from '@/shared/ui/components/EmptyState';
import { ErrorState } from '@/shared/ui/components/ErrorState';
import { useConversations } from '../../application/queries/useConversations.query';
import { ConversationItem } from '../components/ConversationItem';

export function ConversationList({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}): React.JSX.Element {
  const { data, isPending, error } = useConversations();
  const now = new Date();

  if (isPending) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
    );
  }
  if (error) return <ErrorState error={error} />;
  if (data.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay chats"
        description="Cuando un cliente le escriba al WhatsApp de Saba, su conversación aparece acá."
      />
    );
  }

  return (
    <nav aria-label="Conversaciones" className="overflow-y-auto">
      {data.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          selected={conversation.id === selectedId}
          now={now}
          onSelect={onSelect}
        />
      ))}
    </nav>
  );
}
