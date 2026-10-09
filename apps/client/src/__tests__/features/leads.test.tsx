import { HttpResponse, http } from 'msw';
import React from 'react';
import { BACKEND_URL } from '@/__tests__/mocks/backendUrl';
import { LeadsPage } from '@/features/leads/ui/pages/LeadsPage';
import { server } from '../mocks/server';
import { render, screen, userEvent, waitFor } from '../test-utils/test-utils';

describe('LeadsPage', () => {
  it('lists the leads the API returns', async () => {
    render(<LeadsPage />);

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('ana@saba.com')).toBeInTheDocument();
  });

  it('validates the form before calling the API', async () => {
    const user = userEvent.setup();
    render(<LeadsPage />);

    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    expect(
      await screen.findByText('El nombre es obligatorio.')
    ).toBeInTheDocument();
  });

  it('sends the lead and clears the form', async () => {
    let sent: unknown;
    server.use(
      http.post(`${BACKEND_URL}/v1/leads`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(
          {
            success: true,
            data: {
              id: 'lead-2',
              name: 'Luis',
              email: 'luis@saba.com',
              source: null,
              createdAt: '2026-10-02T12:00:00.000Z',
            },
          },
          { status: 201 }
        );
      })
    );
    const user = userEvent.setup();
    render(<LeadsPage />);

    await user.type(screen.getByLabelText('Nombre'), 'Luis');
    await user.type(screen.getByLabelText('Correo'), 'Luis@Saba.com');
    await user.click(screen.getByRole('button', { name: 'Agregar' }));

    await waitFor(() =>
      expect(sent).toEqual({ name: 'Luis', email: 'luis@saba.com' })
    );
    await waitFor(() =>
      expect(screen.getByLabelText('Nombre')).toHaveValue('')
    );
  });
});
