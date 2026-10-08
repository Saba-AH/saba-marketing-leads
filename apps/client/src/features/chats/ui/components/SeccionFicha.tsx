import React from 'react';

/** Un bloque de la ficha del contacto, como las secciones de "Info. del contacto" de WhatsApp. */
export function SeccionFicha({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section
      aria-label={titulo}
      className="flex flex-col gap-2 rounded-lg border p-3"
    >
      <h4 className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
        {titulo}
      </h4>
      {children}
    </section>
  );
}
