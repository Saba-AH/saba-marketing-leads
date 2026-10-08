import type { TConversacionResumen, TMensajeChat } from '@repo/schemas';
import { HttpResponse, http } from 'msw';
import { BACKEND_URL } from '@/__tests__/mocks/backendUrl';

const HORA = 60 * 60 * 1000;
const base = `${BACKEND_URL}/v1/whatsapp/conversaciones`;

/** Ventanas relativas a "ahora" para que abierta/cerrada no dependa del día del test. */
export function conversacionesFixture(): TConversacionResumen[] {
  const ahora = Date.now();
  return [
    {
      id: 'conv-abierta',
      contacto: {
        id: 'c1',
        telefono: '584141234567',
        nombreWhatsApp: 'Ana Pérez',
        vinculadoASaba: true,
      },
      estado: 'abierta',
      noLeidos: 2,
      ultimoMensajeAt: new Date(ahora - HORA).toISOString(),
      ultimoMensajePreview: '¿Tienen la moto en rojo?',
      ventanaExpiraAt: new Date(ahora + 23 * HORA).toISOString(),
    },
    {
      id: 'conv-cerrada',
      contacto: {
        id: 'c2',
        telefono: '584249999999',
        nombreWhatsApp: null,
        vinculadoASaba: false,
      },
      estado: 'abierta',
      noLeidos: 0,
      ultimoMensajeAt: new Date(ahora - 48 * HORA).toISOString(),
      ultimoMensajePreview: 'Gracias',
      ventanaExpiraAt: new Date(ahora - 24 * HORA).toISOString(),
    },
  ];
}

export const mensajesFixture: TMensajeChat[] = [
  {
    id: 'm1',
    direccion: 'entrante',
    origen: 'cliente',
    tipo: 'text',
    cuerpo: '¿Tienen la moto en rojo?',
    estado: null,
    errorDetalle: null,
    tieneMedia: false,
    waTimestamp: '2026-10-07T15:00:00.000Z',
  },
  {
    id: 'm2',
    direccion: 'entrante',
    origen: 'cliente',
    tipo: 'image',
    cuerpo: null,
    estado: null,
    errorDetalle: null,
    tieneMedia: true,
    waTimestamp: '2026-10-07T15:01:00.000Z',
  },
];

export const chatsHandlers = [
  http.get(base, () =>
    HttpResponse.json({ success: true, data: conversacionesFixture() })
  ),
  http.get(`${base}/:id/mensajes`, () =>
    HttpResponse.json({ success: true, data: mensajesFixture })
  ),
  http.post(`${base}/:id/leida`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.post(`${base}/:id/escribiendo`, () =>
    HttpResponse.json({ success: true, data: null })
  ),
  http.post(`${base}/:id/mensajes`, async ({ request }) => {
    const { cuerpo } = (await request.json()) as { cuerpo: string };
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: 'm3',
          direccion: 'saliente',
          origen: 'sistema',
          tipo: 'text',
          cuerpo,
          estado: 'enviado',
          errorDetalle: null,
          tieneMedia: false,
          waTimestamp: new Date().toISOString(),
        } satisfies TMensajeChat,
      },
      { status: 201 }
    );
  }),
];
