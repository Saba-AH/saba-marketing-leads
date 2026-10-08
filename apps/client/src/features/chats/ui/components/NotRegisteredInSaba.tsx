import { UserRoundSearch } from 'lucide-react';
import React from 'react';

/** Fills the whole panel, centered: there is nothing else to show. */
export function NotRegisteredInSaba(): React.JSX.Element {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 px-2 text-center">
      <UserRoundSearch
        aria-hidden="true"
        className="size-10 text-muted-foreground"
      />
      <p className="font-semibold">No está registrado en Saba</p>
      <p className="text-muted-foreground text-sm">
        Ningún perfil de Saba tiene este número: puede ser un lead nuevo.
      </p>
      <p className="text-muted-foreground text-sm">
        Si dice que ya es cliente, puede estar escribiendo desde otro teléfono:
        pídele su <span className="font-medium text-foreground">cédula</span> o{' '}
        <span className="font-medium text-foreground">correo</span> para
        buscarlo en Saba.
      </p>
    </div>
  );
}
