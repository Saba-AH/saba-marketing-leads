import { LockKeyhole, TriangleAlert } from 'lucide-react';
import React from 'react';

/**
 * El backend responde 403 con el código `NIVEL_INSUFICIENTE` (`NivelGuard`).
 * Distinguirlo importa: "no tenés permiso" y "algo falló" piden cosas
 * distintas de quien lo lee.
 */
function esFaltaDePermiso(mensaje: string): boolean {
  return mensaje.includes('NIVEL_INSUFICIENTE');
}

/**
 * Aviso de que la carga falló. Sin esto, `datos ?? []` pinta una tabla vacía y
 * un usuario sin permiso concluye que no hay nada, en vez de que no puede
 * verlo.
 */
export function ErrorState({ error }: { error: Error }): React.JSX.Element {
  const sinPermiso = esFaltaDePermiso(error.message);
  const Icono = sinPermiso ? LockKeyhole : TriangleAlert;

  return (
    <div className="px-5 py-12 text-center text-gray-500">
      <Icono
        aria-hidden="true"
        className="mx-auto mb-2.5 size-10 text-gray-300"
      />
      <div className="mb-1 font-bold text-gray-700 text-sm">
        {sinPermiso
          ? 'No tenés acceso a esta sección'
          : 'No pudimos cargar los datos'}
      </div>
      <div className="text-[12.5px]">
        {sinPermiso
          ? 'Tu nivel de usuario no alcanza para verla. Pedile a un administrador que te lo amplíe.'
          : 'Reintentá en unos segundos. Si sigue fallando, avisale al equipo.'}
      </div>
    </div>
  );
}
