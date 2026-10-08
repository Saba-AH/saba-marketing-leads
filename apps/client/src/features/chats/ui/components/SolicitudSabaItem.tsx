import { cn } from '@repo/ui/lib/utils';
import React from 'react';
import {
  formatearCuota,
  formatearFecha,
  formatearMonto,
  type SolicitudSaba,
  type TonoSolicitud,
  tonoSolicitud,
} from '../../domain/clienteSaba.model';

const TONOS: Record<TonoSolicitud, string> = {
  activa: 'bg-primary text-primary-foreground',
  rechazada: 'bg-destructive text-destructive-foreground',
  cerrada: 'bg-muted text-muted-foreground',
  en_proceso: 'bg-secondary text-secondary-foreground',
};

export function SolicitudSabaItem({
  solicitud,
}: {
  solicitud: SolicitudSaba;
}): React.JSX.Element {
  const monto = formatearMonto(solicitud.montoFinanciado);
  const cuota = formatearCuota(solicitud);
  return (
    <li className="flex flex-col gap-2 rounded-md bg-muted/50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-sm">
            {solicitud.producto ?? 'Producto sin nombre'}
          </p>
          <p className="text-muted-foreground text-xs">
            Creada el {formatearFecha(solicitud.creadaAt)}
          </p>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 font-medium text-xs',
            TONOS[tonoSolicitud(solicitud)]
          )}
        >
          {solicitud.estadoEtiqueta}
        </span>
      </div>
      {(monto || cuota) && (
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {monto && (
            <div>
              <dt className="text-muted-foreground text-xs">Financiado</dt>
              <dd className="font-medium">{monto}</dd>
            </div>
          )}
          {cuota && (
            <div>
              <dt className="text-muted-foreground text-xs">Cuota</dt>
              <dd className="font-medium">{cuota}</dd>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}
