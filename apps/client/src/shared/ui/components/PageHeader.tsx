import React from 'react';

interface PageHeaderProps {
  titulo: string;
  subtitulo: string;
  /** Botonera de la derecha. */
  acciones?: React.ReactNode;
}

/** Encabezado de pantalla del prototipo (`.page-header`). */
export function PageHeader({
  titulo,
  subtitulo,
  acciones,
}: PageHeaderProps): React.JSX.Element {
  return (
    <div className="mb-[22px] flex items-start justify-between gap-4">
      <div>
        <h1 className="font-extrabold text-2xl text-gray-950 tracking-[-0.01em]">
          {titulo}
        </h1>
        <p className="mt-1 text-[13.5px] text-gray-500">{subtitulo}</p>
      </div>
      {acciones && <div className="flex shrink-0 gap-2.5">{acciones}</div>}
    </div>
  );
}
