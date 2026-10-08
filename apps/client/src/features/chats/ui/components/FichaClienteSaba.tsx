import React from 'react';
import { BotonCopiar } from '@/shared/ui/components/BotonCopiar';
import {
  type ClienteSaba,
  formatearFecha,
} from '../../domain/clienteSaba.model';
import { DatoCliente } from './DatoCliente';
import { SolicitudSabaItem } from './SolicitudSabaItem';

export function FichaClienteSaba({
  cliente,
}: {
  cliente: ClienteSaba;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-semibold">{cliente.nombre || 'Sin nombre'}</h3>
        {cliente.cedula ? (
          <div className="flex items-center gap-1 text-sm">
            <span>Cédula {cliente.cedula}</span>
            <BotonCopiar valor={cliente.cedula} etiqueta="Copiar cédula" />
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Sin cédula registrada</p>
        )}
      </div>

      <dl className="grid gap-2">
        <DatoCliente etiqueta="Correo" valor={cliente.correo} />
        <DatoCliente etiqueta="Teléfono en Saba" valor={cliente.telefono} />
        <DatoCliente etiqueta="Ciudad" valor={cliente.ciudad} />
        <DatoCliente
          etiqueta="Cliente desde"
          valor={
            cliente.clienteDesde ? formatearFecha(cliente.clienteDesde) : null
          }
        />
        <DatoCliente etiqueta="Origen" valor={cliente.origen} />
      </dl>

      <section aria-label="Solicitudes" className="flex flex-col gap-2">
        <h4 className="font-medium text-sm">Solicitudes</h4>
        {cliente.solicitudes.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Todavía no tiene solicitudes.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {cliente.solicitudes.map((solicitud) => (
              <SolicitudSabaItem key={solicitud.id} solicitud={solicitud} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
