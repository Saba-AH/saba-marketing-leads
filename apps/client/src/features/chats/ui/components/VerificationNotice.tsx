import { ShieldAlert } from 'lucide-react';
import React from 'react';

/** The match is by phone only: it does not prove the person writing is the holder. */
export function VerificationNotice(): React.JSX.Element {
  return (
    <div
      role="note"
      className="flex items-start gap-2 rounded-md border bg-muted p-3 text-sm"
    >
      <ShieldAlert
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <p>
        Coincidencia <span className="font-medium">solo por teléfono</span>.
        Antes de dar información, confirma su{' '}
        <span className="font-medium">cédula</span> o{' '}
        <span className="font-medium">correo</span>: puede estar escribiendo
        desde el teléfono de otra persona.
      </p>
    </div>
  );
}
