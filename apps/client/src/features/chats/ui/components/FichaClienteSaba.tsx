import { IdCard, Mail, MapPin, Megaphone, Phone } from 'lucide-react';
import React from 'react';
import { BotonCopiar } from '@/shared/ui/components/BotonCopiar';
import {
  type ClienteSaba,
  formatearTelefonoSaba,
} from '../../domain/clienteSaba.model';
import { DatoCliente } from './DatoCliente';
import { SeccionFicha } from './SeccionFicha';
import { SolicitudSabaItem } from './SolicitudSabaItem';

export function FichaClienteSaba({
  cliente,
}: {
  cliente: ClienteSaba;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-3">
      <SeccionFicha titulo="Identificación">
        {cliente.cedula ? (
          <DatoCliente
            icono={IdCard}
            etiqueta="Cédula"
            valor={cliente.cedula}
            accion={
              <BotonCopiar valor={cliente.cedula} etiqueta="Copiar cédula" />
            }
          />
        ) : (
          <p className="text-muted-foreground text-sm">Sin cédula registrada</p>
        )}
      </SeccionFicha>

      {(cliente.correo || cliente.telefono) && (
        <SeccionFicha titulo="Contacto">
          <DatoCliente icono={Mail} etiqueta="Correo" valor={cliente.correo} />
          <DatoCliente
            icono={Phone}
            etiqueta="Teléfono en Saba"
            valor={
              cliente.telefono ? formatearTelefonoSaba(cliente.telefono) : null
            }
          />
        </SeccionFicha>
      )}

      {(cliente.ciudad || cliente.origen) && (
        <SeccionFicha titulo="Perfil">
          <DatoCliente
            icono={MapPin}
            etiqueta="Ciudad"
            valor={cliente.ciudad}
          />
          <DatoCliente
            icono={Megaphone}
            etiqueta="Origen"
            valor={cliente.origen}
          />
        </SeccionFicha>
      )}

      <SeccionFicha titulo={`Solicitudes (${cliente.solicitudes.length})`}>
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
      </SeccionFicha>
    </div>
  );
}
