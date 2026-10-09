import React from 'react';
import { Pill } from './Pill';

/** Active/Inactive: the same pair of ternaries was repeated on two screens. */
export function ActiveStatusPill({
  active,
}: {
  active: boolean;
}): React.JSX.Element {
  return (
    <Pill tone={active ? 'active' : 'inactive'}>
      {active ? 'Activo' : 'Inactivo'}
    </Pill>
  );
}
