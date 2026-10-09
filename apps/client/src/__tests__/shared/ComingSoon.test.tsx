import React from 'react';
import { ComingSoon } from '@/shared/ui/components/ComingSoon';
import { fireEvent, render, screen } from '../test-utils/test-utils';

describe('ComingSoon', () => {
  it('shows the wrapped content and the "Próximamente" badge', () => {
    render(
      <ComingSoon>
        <button type="button">Excel</button>
      </ComingSoon>
    );

    expect(screen.getByText('Excel')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });

  it('does not trigger any action on click', () => {
    const onClick = jest.fn();
    render(
      <ComingSoon>
        <button type="button" onClick={onClick}>
          Excel
        </button>
      </ComingSoon>
    );

    fireEvent.click(screen.getByText('Excel'));

    expect(onClick).not.toHaveBeenCalled();
  });
});
