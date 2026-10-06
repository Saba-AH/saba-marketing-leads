import React from 'react';

export type PillTono = 'interno' | 'externo' | 'activo' | 'inactivo';

/** Tonos del prototipo, resueltos con los tokens del sistema de diseño. */
const TONOS: Record<PillTono, { contenedor: string; punto: string }> = {
  interno: { contenedor: 'bg-brand-50 text-brand-700', punto: 'bg-brand-600' },
  externo: {
    contenedor: 'bg-secondary-100 text-secondary-700',
    punto: 'bg-secondary-700',
  },
  activo: {
    contenedor: 'bg-success-50 text-success-700',
    punto: 'bg-success-600',
  },
  inactivo: { contenedor: 'bg-gray-200 text-gray-600', punto: 'bg-gray-500' },
};

/** Etiqueta de estado del prototipo (`.pill` + `.pill-dot`). */
export function Pill({
  tono,
  children,
}: {
  tono: PillTono;
  children: React.ReactNode;
}): React.JSX.Element {
  const { contenedor, punto } = TONOS[tono];
  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-full px-[9px] py-[3px] font-bold text-[11.5px] ${contenedor}`}
    >
      <span className={`size-1.5 rounded-full ${punto}`} />
      {children}
    </span>
  );
}
