import { HttpResponse, http } from 'msw';
import React from 'react';
import { BACKEND_URL } from '@/__tests__/mocks/backendUrl';
import { clienteSabaFixture } from '@/__tests__/mocks/handlers/chats.mock';
import { ChatsPage } from '@/features/chats/ui/pages/ChatsPage';
import { server } from '../mocks/server';
import {
  fireEvent,
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

  it('abre el hilo, muestra la imagen del cliente y lo marca leído', async () => {
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
      within(hilo).getByRole('img', { name: 'Imagen del cliente' })
    ).toHaveAttribute('src', '/api/backend/v1/whatsapp/mensajes/m2/media');
    expect(
      screen.getByText(/Ventana de respuesta: quedan/)
    ).toBeInTheDocument();
    await waitFor(() => expect(marcada).toBe('conv-abierta'));
  });

  it('muestra un loader mientras la imagen baja y lo quita al terminar', async () => {
    const user = userEvent.setup();
    render(<ChatsPage />);
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));

    const imagen = await screen.findByRole('img', {
      name: 'Imagen del cliente',
    });
    expect(screen.getByRole('status')).toHaveTextContent('Cargando imagen…');

    fireEvent.load(imagen);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('vuelve al aviso si Meta ya no tiene la imagen', async () => {
    const user = userEvent.setup();
    render(<ChatsPage />);
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));

    fireEvent.error(
      await screen.findByRole('img', { name: 'Imagen del cliente' })
    );

    expect(
      await screen.findByText(
        '📷 Imagen — ver en el celular (ya no está en WhatsApp)'
      )
    ).toBeInTheDocument();
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
              tieneMedia: false,
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

  it('le avisa a Meta que se está escribiendo, una sola vez por ráfaga de teclas', async () => {
    const avisos: string[] = [];
    server.use(
      http.post(`${base}/:id/escribiendo`, ({ params }) => {
        avisos.push(String(params.id));
        return HttpResponse.json({ success: true, data: null });
      })
    );
    const user = userEvent.setup();
    render(<ChatsPage />);
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));

    await user.type(
      await screen.findByLabelText('Mensaje'),
      'Hola, ¿cómo estás?'
    );

    await waitFor(() => expect(avisos).toEqual(['conv-abierta']));
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

  it('muestra la flecha para bajar solo si subiste a leer, y baja al tocarla', async () => {
    const user = userEvent.setup();
    render(<ChatsPage />);
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));
    const lista = await screen.findByRole('list', { name: 'Mensajes' });
    const contenedor = lista.parentElement as HTMLElement;
    expect(
      screen.queryByRole('button', { name: /Ir a los mensajes más nuevos/ })
    ).not.toBeInTheDocument();

    // jsdom no hace layout: se simula haber subido 600 px en un hilo de 1000.
    Object.defineProperty(contenedor, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(contenedor, 'clientHeight', {
      configurable: true,
      value: 300,
    });
    contenedor.scrollTop = 100;
    fireEvent.scroll(contenedor);

    await user.click(
      await screen.findByRole('button', {
        name: /Ir a los mensajes más nuevos/,
      })
    );

    expect(
      screen.queryByRole('button', { name: /Ir a los mensajes más nuevos/ })
    ).not.toBeInTheDocument();
  });

  it('vuelve a la lista desde el hilo (pantallas angostas)', async () => {
    const user = userEvent.setup();
    render(<ChatsPage />);
    await user.click(await screen.findByRole('button', { name: /Ana Pérez/ }));
    expect(
      await screen.findByRole('list', { name: 'Mensajes' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Volver a los chats' })
    );

    expect(
      screen.queryByRole('list', { name: 'Mensajes' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Elige una conversación para ver los mensajes.')
    ).toBeInTheDocument();
  });

  describe('cliente en Saba', () => {
    async function abrirChatDeAna(): Promise<HTMLElement> {
      const user = userEvent.setup();
      render(<ChatsPage />);
      await user.click(
        await screen.findByRole('button', { name: /Ana Pérez/ })
      );
      return screen.getByRole('complementary', { name: 'Cliente en Saba' });
    }

    it('muestra quién es en Saba y sus solicitudes al abrir el chat', async () => {
      const panel = await abrirChatDeAna();

      expect(
        await within(panel).findByText('Ana María González')
      ).toBeInTheDocument();
      expect(within(panel).getByText('Cédula V12345678')).toBeInTheDocument();
      expect(within(panel).getByText('CF 450MT')).toBeInTheDocument();
      expect(within(panel).getByText('Cita agendada')).toBeInTheDocument();
      expect(
        within(panel).getByText(/Cuota \$40,00 semanal/)
      ).toBeInTheDocument();
    });

    it('copia la cédula al portapapeles', async () => {
      const user = userEvent.setup();
      // Después de setup(): user-event reemplaza navigator.clipboard por el suyo.
      const writeText = jest.spyOn(navigator.clipboard, 'writeText');
      render(<ChatsPage />);
      await user.click(
        await screen.findByRole('button', { name: /Ana Pérez/ })
      );
      const panel = screen.getByRole('complementary', {
        name: 'Cliente en Saba',
      });

      await user.click(
        await within(panel).findByRole('button', { name: 'Copiar cédula' })
      );

      expect(writeText).toHaveBeenCalledWith('V12345678');
      expect(
        await within(panel).findByRole('button', { name: 'Copiado' })
      ).toBeInTheDocument();
    });

    it('deja elegir cuando varios perfiles tienen el mismo número', async () => {
      server.use(
        http.get(`${base}/:id/cliente-saba`, () =>
          HttpResponse.json({
            success: true,
            data: {
              sinTelefono: false,
              clientes: [
                clienteSabaFixture,
                {
                  ...clienteSabaFixture,
                  id: 'p2',
                  nombre: 'José González',
                  cedula: 'V87654321',
                },
              ],
            },
          })
        )
      );
      const user = userEvent.setup();
      render(<ChatsPage />);
      await user.click(
        await screen.findByRole('button', { name: /Ana Pérez/ })
      );
      const panel = screen.getByRole('complementary', {
        name: 'Cliente en Saba',
      });

      expect(
        await within(panel).findByText('Hay 2 perfiles con este número:')
      ).toBeInTheDocument();
      await user.click(
        within(panel).getByRole('button', { name: 'José González' })
      );

      expect(within(panel).getByText('Cédula V87654321')).toBeInTheDocument();
    });

    it('avisa cuando el número no está en Saba', async () => {
      server.use(
        http.get(`${base}/:id/cliente-saba`, () =>
          HttpResponse.json({
            success: true,
            data: { sinTelefono: false, clientes: [] },
          })
        )
      );
      const panel = await abrirChatDeAna();

      expect(
        await within(panel).findByText('No está registrado en Saba')
      ).toBeInTheDocument();
    });

    it('muestra el error de Saba y deja reintentar sin afectar el chat', async () => {
      let intentos = 0;
      server.use(
        http.get(`${base}/:id/cliente-saba`, () => {
          intentos++;
          return HttpResponse.json(
            {
              success: false,
              error:
                'No se pudo consultar Saba en este momento. Intenta de nuevo en unos segundos.',
              code: 'SABA_CLIENTES_NO_DISPONIBLE',
            },
            { status: 424 }
          );
        })
      );
      const user = userEvent.setup();
      render(<ChatsPage />);
      await user.click(
        await screen.findByRole('button', { name: /Ana Pérez/ })
      );
      const panel = screen.getByRole('complementary', {
        name: 'Cliente en Saba',
      });

      expect(
        await within(panel).findByText(
          /No se pudo consultar Saba/,
          {},
          { timeout: 3000 }
        )
      ).toBeInTheDocument();
      expect(
        screen.getByRole('list', { name: 'Mensajes' })
      ).toBeInTheDocument();
      const antes = intentos;
      await user.click(
        within(panel).getByRole('button', { name: 'Reintentar' })
      );
      await waitFor(() => expect(intentos).toBeGreaterThan(antes));
    });
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
