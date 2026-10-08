'use client';

import { Button } from '@repo/ui/components/button';
import { Check, Copy } from 'lucide-react';
import React from 'react';

const CONFIRMACION_MS = 2_000;

/** Copia `valor` al portapapeles y confirma por un momento ("Copiado"). */
export function BotonCopiar({
  valor,
  etiqueta,
}: {
  valor: string;
  /** Para lectores de pantalla: "Copiar cédula". */
  etiqueta: string;
}): React.JSX.Element {
  const [copiado, setCopiado] = React.useState(false);

  React.useEffect(() => {
    if (!copiado) return;
    const timer = setTimeout(() => setCopiado(false), CONFIRMACION_MS);
    return () => clearTimeout(timer);
  }, [copiado]);

  async function copiar(): Promise<void> {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
    } catch {
      // Sin permiso de portapapeles (http, iframe): el valor sigue visible para copiarlo a mano.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => void copiar()}
      aria-label={copiado ? 'Copiado' : etiqueta}
      className="h-7 gap-1 px-2 text-xs"
    >
      {copiado ? (
        <Check aria-hidden="true" className="size-3.5" />
      ) : (
        <Copy aria-hidden="true" className="size-3.5" />
      )}
      {copiado ? 'Copiado' : 'Copiar'}
    </Button>
  );
}
