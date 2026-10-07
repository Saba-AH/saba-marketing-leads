import { describe, expect, it } from 'vitest';
import { PayloadWebhookInvalidoException } from '../../modules/whatsapp/domain/exceptions/PayloadWebhookInvalidoException';
import { estadosQueAvanzanA } from '../../modules/whatsapp/domain/Inbox';
import { interpretarWebhook } from '../../modules/whatsapp/domain/interpretarWebhook';
import { extraerCambios } from '../../modules/whatsapp/domain/WebhookCambio';
import mensajeTextoEntrante from '../fixtures/whatsapp/mensajeTextoEntrante.json';

function valueDelFixture(): unknown {
  const [cambio] = extraerCambios(mensajeTextoEntrante);
  return cambio?.payload;
}

describe('interpretarWebhook', () => {
  it('traduce el mensaje de texto real de Meta', () => {
    expect(interpretarWebhook('messages', valueDelFixture())).toEqual([
      {
        tipo: 'mensajeEntrante',
        mensaje: {
          wamid: 'wamid.FIXTURE_TEXTO_ENTRANTE',
          identidad: {
            waId: '584140000001',
            userId: 'VE.0000000000000001',
          },
          profileName: 'Cliente Prueba',
          tipo: 'text',
          cuerpo: 'hola prueba',
          mediaId: null,
          waTimestamp: new Date(1791403246 * 1000),
          preview: 'hola prueba',
          abreVentana: true,
        },
      },
    ]);
  });

  it('identifica por user_id cuando el cliente no comparte el teléfono', () => {
    const [accion] = interpretarWebhook('messages', {
      contacts: [{ user_id: 'VE.9', profile: { name: 'Ana' } }],
      messages: [
        {
          id: 'wamid.U',
          from_user_id: 'VE.9',
          timestamp: '1791403246',
          type: 'text',
          text: { body: 'hola' },
        },
      ],
    });

    expect(accion).toMatchObject({
      mensaje: {
        identidad: { waId: null, userId: 'VE.9' },
        profileName: 'Ana',
      },
    });
  });

  it('usa el caption y el media_id de una imagen, y la etiqueta si no hay caption', () => {
    const acciones = interpretarWebhook('messages', {
      messages: [
        {
          id: 'wamid.I1',
          from: '584140000001',
          timestamp: '1791403246',
          type: 'image',
          image: { id: 'MEDIA1', caption: 'mi cédula' },
        },
        {
          id: 'wamid.I2',
          from: '584140000001',
          timestamp: '1791403247',
          type: 'image',
          image: { id: 'MEDIA2' },
        },
      ],
    });

    expect(acciones).toMatchObject([
      {
        mensaje: {
          cuerpo: 'mi cédula',
          mediaId: 'MEDIA1',
          preview: 'mi cédula',
        },
      },
      { mensaje: { cuerpo: null, mediaId: 'MEDIA2', preview: '📷 Imagen' } },
    ]);
  });

  it('no abre la ventana con una reacción', () => {
    const [accion] = interpretarWebhook('messages', {
      messages: [
        {
          id: 'wamid.R',
          from: '584140000001',
          timestamp: '1791403246',
          type: 'reaction',
          reaction: { message_id: 'wamid.X', emoji: '👍' },
        },
      ],
    });

    expect(accion).toMatchObject({
      mensaje: { cuerpo: '👍', abreVentana: false },
    });
  });

  it('traduce los estados de entrega y conserva el error de un envío fallido', () => {
    expect(
      interpretarWebhook('messages', {
        statuses: [
          { id: 'wamid.A', status: 'delivered', recipient_id: '584140000001' },
          {
            id: 'wamid.B',
            status: 'failed',
            errors: [
              {
                code: 131047,
                title: 'Re-engagement message',
                error_data: {
                  details:
                    'Message failed to send because more than 24 hours have passed',
                },
              },
            ],
          },
          { id: 'wamid.C', status: 'deleted' },
        ],
      })
    ).toEqual([
      {
        tipo: 'estadoMensaje',
        cambio: {
          wamid: 'wamid.A',
          estado: 'entregado',
          errorCodigo: null,
          errorDetalle: null,
        },
      },
      {
        tipo: 'estadoMensaje',
        cambio: {
          wamid: 'wamid.B',
          estado: 'fallido',
          errorCodigo: '131047',
          errorDetalle:
            'Message failed to send because more than 24 hours have passed',
        },
      },
    ]);
  });

  it('ignora los campos que la fase 1 no procesa', () => {
    expect(interpretarWebhook('account_update', { event: 'X' })).toEqual([]);
    expect(interpretarWebhook('message_template_status_update', {})).toEqual(
      []
    );
  });

  it('rechaza un mensaje sin teléfono ni user_id', () => {
    expect(() =>
      interpretarWebhook('messages', {
        messages: [{ id: 'wamid.X', timestamp: '1', type: 'text' }],
      })
    ).toThrow(PayloadWebhookInvalidoException);
  });
});

describe('estadosQueAvanzanA', () => {
  it('no deja retroceder un estado', () => {
    expect(estadosQueAvanzanA('enviado')).not.toContain('entregado');
    expect(estadosQueAvanzanA('entregado')).not.toContain('leido');
    expect(estadosQueAvanzanA('fallido')).not.toContain('leido');
    expect(estadosQueAvanzanA('leido')).toContain('entregado');
  });
});
