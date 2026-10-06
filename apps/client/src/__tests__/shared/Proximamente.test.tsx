import React from 'react';
import { Proximamente } from '@/shared/ui/components/Proximamente';
import { fireEvent, render, screen } from '../test-utils/test-utils';

describe('Proximamente', () => {
  it('muestra el contenido envuelto y el badge "Próximamente"', () => {
    render(
      <Proximamente>
        <button type="button">Excel</button>
      </Proximamente>
    );

    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });

  it('no dispara ninguna acción al hacer click', () => {
    const onClick = jest.fn();
    render(
      <Proximamente>
        <button type="button" onClick={onClick}>
          Excel
        </button>
      </Proximamente>
    );

    fireEvent.click(screen.getByText('Excel'));

    expect(onClick).not.toHaveBeenCalled();
  });
});
