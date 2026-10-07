import { HttpResponse, http } from 'msw';
import React from 'react';
import { BACKEND_URL } from '@/__tests__/mocks/backendUrl';
import { ChatsPage } from '@/features/chats/ui/pages/ChatsPage';
import { server } from '../mocks/server';
import {
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from '../test-utils/test-utils';

const base = `${BACKEND_URL}/v1/whatsapp/conversaciones`;

describe('ChatsPage', () => {
  it('lista las conversaciones con su vista previa y los no leídos', async () => {
    render(<ChatsPage />);

    const lista = await screen.findByRole('navigation', {
      name: 'Conversaciones',
    });
    expect(within(lista).getByText('Ana Pérez')).toBeInTheDocument();
    expect(
      within(lista).getByText('¿Tienen la moto en rojo?')
    ).toBeInTheDocument();
    expect(within(lista).getByLabelText('2 sin leer')).toBeInTheDocument();
    // Sin nombre de WhatsApp se muestra el teléfono.
    expect(within(lista).getByText('+58 424 999 9999')).toBeInTheDocument();
  });

  it('abre el hilo, avisa los mensajes que no son texto y lo marca leído', async () => {
    let marcada: string | undefined;
    server.use(
      http.post(`${base}/:id/leida`, ({ params }) => {
        marcada = String(params.id);
        return HttpResponse.json({ success: true, data: null });
      })
    );
    const user = userEvent.setup();
    render(<ChatsPage />);

    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));

    const hilo = await screen.findByRole('list', { name: 'Mensajes' });
    expect(
      within(hilo).getByText('¿Tienen la moto en rojo?')
    ).toBeInTheDocument();
    expect(
      within(hilo).getByText('📷 Imagen — ver en el celular')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ventana de respuesta: quedan/)
    ).toBeInTheDocument();
    await waitFor(() => expect(marcada).toBe('conv-abierta'));
  });

  it('envía la respuesta y limpia el compositor', async () => {
    let enviado: unknown;
    server.use(
      http.post(`${base}/:id/mensajes`, async ({ request }) => {
        enviado = await request.json();
        return HttpResponse.json(
          {
            success: true,
            data: {
              id: 'm3',
              direccion: 'saliente',
              origen: 'sistema',
              tipo: 'text',
              cuerpo: 'Sí, la tenemos',
              estado: 'enviado',
              errorDetalle: null,
              waTimestamp: new Date().toISOString(),
            },
          },
          { status: 201 }
        );
      })
    );
    const user = userEvent.setup();
    render(<ChatsPage />);
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));

    const caja = await screen.findByLabelText('Mensaje');
    await user.type(caja, 'Sí, la tenemos');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await waitFor(() => expect(enviado).toEqual({ cuerpo: 'Sí, la tenemos' }));
    await waitFor(() => expect(caja).toHaveValue(''));
  });

  it('muestra el error de la API si WhatsApp rechaza el envío', async () => {
    server.use(
      http.post(`${base}/:id/mensajes`, () =>
        HttpResponse.json(
          {
            success: false,
            error:
              'Este número no está en la lista de destinatarios permitidos del número de prueba.',
            code: 'WHATSAPP_DESTINATARIO_NO_PERMITIDO',
          },
          { status: 422 }
        )
      )
    );
    const user = userEvent.setup();
    render(<ChatsPage />);
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));

    await user.type(await screen.findByLabelText('Mensaje'), 'Hola');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    expect(
      await screen.findByText(/destinatarios permitidos/)
    ).toBeInTheDocument();
  });

  it('bloquea el compositor con la ventana de 24 h cerrada', async () => {
    const user = userEvent.setup();
    render(<ChatsPage />);

    await user.click(
      await screen.findByRole('button', { name: /\+58 424 999 9999/ })
    );

    expect(await screen.findByText(/Pasaron más de 24 h/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Mensaje')).not.toBeInTheDocument();
  });

  it('no envía un mensaje vacío', async () => {
    let llamadas = 0;
    server.use(
      http.post(`${base}/:id/mensajes`, () => {
        llamadas++;
        return HttpResponse.json(
          { success: false, error: 'x' },
          { status: 400 }
        );
      })
    );
    const user = userEvent.setup();
    render(<ChatsPage />);
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));

    await user.click(await screen.findByRole('button', { name: 'Enviar' }));

    expect(await screen.findByText('Escribe un mensaje.')).toBeInTheDocument();
    expect(llamadas).toBe(0);
  });
});
