'use client';

import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import { useSabaCustomer } from '../../application/queries/useSabaCustomer.query';
import {
  type Conversation,
  displayName,
  formatPhone,
} from '../../domain/chat.model';
import { formatMonthYear } from '../../domain/sabaCustomer.model';
import { InitialsAvatar } from '../components/InitialsAvatar';
import { NotRegisteredInSaba } from '../components/NotRegisteredInSaba';
import { PanelNotice } from '../components/PanelNotice';
import { SabaCustomerCard } from '../components/SabaCustomerCard';
import { VerificationNotice } from '../components/VerificationNotice';

/**
 * "Contact info": who they are on WhatsApp and, below, who they are in Saba. If
 * Saba fails, the chat keeps working: only this panel shows the error.
 */
export function SabaCustomerPanel({
  conversation,
}: {
  conversation: Conversation;
}): React.JSX.Element {
  const { data, isPending, error, refetch, isFetching } = useSabaCustomer(
    conversation.id
  );
  const [chosen, setChosen] = React.useState(0);
  const customer = data?.customers[chosen] ?? data?.customers[0] ?? null;
  const name = customer?.name || displayName(conversation);
  const { phone } = conversation.contact;

  if (data && !data.noPhone && !customer) return <NotRegisteredInSaba />;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <InitialsAvatar name={name} size="lg" />
        <p className="mt-2 font-semibold text-lg">{name}</p>
        {phone && (
          <p className="text-muted-foreground text-sm">{formatPhone(phone)}</p>
        )}
        {customer?.customerSince && (
          <p className="text-muted-foreground text-xs">
            Cliente de Saba desde {formatMonthYear(customer.customerSince)}
          </p>
        )}
      </div>

      {isPending && (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-16" />
          <Skeleton className="h-20" />
          <Skeleton className="h-24" />
        </div>
      )}

      {error && (
        <PanelNotice>
          <p role="alert">{error.message}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Reintentar
          </Button>
        </PanelNotice>
      )}

      {data?.noPhone && (
        <PanelNotice>
          <p>
            Este contacto solo comparte su nombre de usuario de WhatsApp: no hay
            teléfono para buscarlo en Saba.
          </p>
        </PanelNotice>
      )}

      {data && data.customers.length > 1 && (
        <div className="flex flex-col gap-2 rounded-md bg-muted p-3 text-sm">
          <p>Hay {data.customers.length} perfiles con este número:</p>
          <div className="flex flex-wrap gap-1">
            {data.customers.map((c, index) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === customer?.id}
                onClick={() => setChosen(index)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-xs',
                  c.id === customer?.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background'
                )}
              >
                {c.name || `Perfil ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {customer && (
        <>
          <VerificationNotice />
          <SabaCustomerCard customer={customer} />
        </>
      )}
    </div>
  );
}
