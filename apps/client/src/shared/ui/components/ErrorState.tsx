import { LockKeyhole, TriangleAlert } from 'lucide-react';
import React from 'react';

/**
 * The backend answers 403 with the `NIVEL_INSUFICIENTE` code (`NivelGuard`).
 * Telling it apart matters: "you do not have permission" and "something failed"
 * ask different things of whoever reads it.
 */
function isForbidden(message: string): boolean {
  return message.includes('NIVEL_INSUFICIENTE');
}

/**
 * Notice that loading failed. Without this, `data ?? []` paints an empty table
 * and a user without permission concludes there is nothing, instead of that
 * they cannot see it.
 */
export function ErrorState({ error }: { error: Error }): React.JSX.Element {
  const forbidden = isForbidden(error.message);
  const Icon = forbidden ? LockKeyhole : TriangleAlert;

  return (
    <div className="px-5 py-12 text-center text-gray-500">
      <Icon
        aria-hidden="true"
        className="mx-auto mb-2.5 size-10 text-gray-300"
      />
      <div className="mb-1 font-bold text-gray-700 text-sm">
        {forbidden
          ? 'No tenés acceso a esta sección'
          : 'No pudimos cargar los datos'}
      </div>
      <div className="text-[12.5px]">
        {forbidden
          ? 'Tu nivel de usuario no alcanza para verla. Pedile a un administrador que te lo amplíe.'
          : 'Reintentá en unos segundos. Si sigue fallando, avisale al equipo.'}
      </div>
    </div>
  );
}
