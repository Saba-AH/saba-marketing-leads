import React from 'react';

/** Un par etiqueta/valor de la ficha; no se muestra si Saba no tiene el dato. */
export function DatoCliente({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor: string | null;
}): React.JSX.Element | null {
  if (!valor) return null;
  return (
    <div className="flex flex-col">
      <dt className="text-muted-foreground text-xs">{etiqueta}</dt>
      <dd className="break-words text-sm">{valor}</dd>
    </div>
  );
}
