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
    <li className="flex flex-col gap-1 rounded-md border p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate font-medium">
          {solicitud.producto ?? 'Producto sin nombre'}
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 font-medium text-xs',
            TONOS[tonoSolicitud(solicitud)]
          )}
        >
          {solicitud.estadoEtiqueta}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        {formatearFecha(solicitud.creadaAt)}
        {monto && ` · Financiado ${monto}`}
        {cuota && ` · Cuota ${cuota}`}
      </p>
    </li>
  );
}
