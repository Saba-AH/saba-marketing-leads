'use client';

import { Button } from '@repo/ui/components/button';
import { Skeleton } from '@repo/ui/components/skeleton';
import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import { useClienteSaba } from '../../application/queries/useClienteSaba.query';
import {
  type Conversacion,
  formatearTelefono,
  nombreVisible,
} from '../../domain/chat.model';
import { formatearMesAnio } from '../../domain/clienteSaba.model';
import { AvatarIniciales } from '../components/AvatarIniciales';
import { AvisoPanel } from '../components/AvisoPanel';
import { FichaClienteSaba } from '../components/FichaClienteSaba';

/**
 * "Info. del contacto": quién es en WhatsApp y, debajo, quién es en Saba. Si
 * Saba falla, el chat sigue funcionando: solo este panel muestra el error.
 */
export function PanelClienteSaba({
  conversacion,
}: {
  conversacion: Conversacion;
}): React.JSX.Element {
  const { data, isPending, error, refetch, isFetching } = useClienteSaba(
    conversacion.id
  );
  const [elegido, setElegido] = React.useState(0);
  const cliente = data?.clientes[elegido] ?? data?.clientes[0] ?? null;
  const nombre = cliente?.nombre || nombreVisible(conversacion);
  const { telefono } = conversacion.contacto;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <AvatarIniciales nombre={nombre} tamano="lg" />
        <p className="mt-2 font-semibold text-lg">{nombre}</p>
        {telefono && (
          <p className="text-muted-foreground text-sm">
            {formatearTelefono(telefono)}
          </p>
        )}
        {cliente?.clienteDesde && (
          <p className="text-muted-foreground text-xs">
            Cliente de Saba desde {formatearMesAnio(cliente.clienteDesde)}
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
      )}

      {data?.sinTelefono && (
        <AvisoPanel>
          <p>
            Este contacto solo comparte su nombre de usuario de WhatsApp: no hay
            teléfono para buscarlo en Saba.
          </p>
        </AvisoPanel>
      )}

      {data && !data.sinTelefono && !cliente && (
        <AvisoPanel>
          <p className="font-medium text-foreground">
            No está registrado en Saba
          </p>
          <p>Ningún perfil de Saba tiene este número: es un lead nuevo.</p>
        </AvisoPanel>
      )}

      {data && data.clientes.length > 1 && (
        <div className="flex flex-col gap-2 rounded-md bg-muted p-3 text-sm">
          <p>Hay {data.clientes.length} perfiles con este número:</p>
          <div className="flex flex-wrap gap-1">
            {data.clientes.map((c, indice) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={c.id === cliente?.id}
                onClick={() => setElegido(indice)}
                className={cn(
                  'rounded-full border px-2 py-0.5 text-xs',
                  c.id === cliente?.id
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

      {cliente && <FichaClienteSaba cliente={cliente} />}
    </div>
  );
}
