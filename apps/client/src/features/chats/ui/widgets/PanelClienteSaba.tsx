'use client';

import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import { useClienteSaba } from '../../application/queries/useClienteSaba.query';
import { AvisoPanel } from '../components/AvisoPanel';
import { FichaClienteSaba } from '../components/FichaClienteSaba';

/**
 * Quién es el cliente en Saba. Si Saba falla, el chat sigue funcionando: solo
 * este panel muestra el error y deja reintentar.
 */
export function PanelClienteSaba({
  conversationId,
}: {
  conversationId: string;
}): React.JSX.Element {
  const { data, isPending, error, refetch, isFetching } =
    useClienteSaba(conversationId);
  const [elegido, setElegido] = React.useState(0);

  if (isPending) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  if (error) {
    return (
      <AvisoPanel>
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
      </AvisoPanel>
    );
  }

  if (data.sinTelefono) {
    return (
      <AvisoPanel>
        <p>
          Este contacto solo comparte su nombre de usuario de WhatsApp: no hay
          teléfono para buscarlo en Saba.
        </p>
      </AvisoPanel>
    );
  }

  const cliente = data.clientes[elegido] ?? data.clientes[0];
  if (!cliente) {
    return (
      <AvisoPanel>
        <p className="font-medium text-foreground">
          No está registrado en Saba
        </p>
        <p>Ningún perfil de Saba tiene este número: es un lead nuevo.</p>
      </AvisoPanel>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.clientes.length > 1 && (
        <div className="flex flex-col gap-2 rounded-md bg-muted p-3 text-sm">
          <p>Hay {data.clientes.length} perfiles con este número:</p>
          <div className="flex flex-wrap gap-1">
            {data.clientes.map((c, indice) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === cliente.id}
                onClick={() => setElegido(indice)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-xs',
                  c.id === cliente.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'bg-background'
                )}
              >
                {c.nombre || `Perfil ${indice + 1}`}
              </button>
            ))}
          </div>
        </div>
      )}
      <FichaClienteSaba cliente={cliente} />
    </div>
  );
}
