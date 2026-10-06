import React from 'react';
import { Pill } from './Pill';

/** Activo/Inactivo: el mismo par de ternarios se repetía en dos pantallas. */
export function EstadoPill({ activo }: { activo: boolean }): React.JSX.Element {
  return (
    <Pill tono={activo ? 'activo' : 'inactivo'}>
      {activo ? 'Activo' : 'Inactivo'}
    </Pill>
  );
}
