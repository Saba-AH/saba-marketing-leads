import { afterEach, describe, expect, it, vi } from 'vitest';
import { ErrorEnvioMeta } from '../../modules/whatsapp/domain/Chats';
import { WhatsAppNoConfiguradoException } from '../../modules/whatsapp/domain/exceptions/whatsappExceptions';
import { GraphWhatsAppCloudAdapter } from '../../modules/whatsapp/infrastructure/external/GraphWhatsAppCloudAdapter';
import type { WhatsAppConfig } from '../../modules/whatsapp/infrastructure/whatsappConfig';

const CONFIG: WhatsAppConfig = {
  appSecret: null,
  verifyToken: null,
  accessToken: 'token',
  phoneNumberId: '1014761568397246',
  graphVersion: 'v26.0',
};

function respuesta(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('GraphWhatsAppCloudAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('manda el texto al número y devuelve el wamid', async () => {
    const fetchMock = vi.fn(async () =>
      respuesta(200, { messages: [{ id: 'wamid.OK' }] })
    );
    vi.stubGlobal('fetch', fetchMock);

    const wamid = await new GraphWhatsAppCloudAdapter(CONFIG).enviarTexto(
      '584140000001',
      'Hola'
    );

    expect(wamid).toBe('wamid.OK');
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      'https://graph.facebook.com/v26.0/1014761568397246/messages'
    );
    expect(init.headers).toMatchObject({ Authorization: 'Bearer token' });
    expect(JSON.parse(String(init.body))).toMatchObject({
      messaging_product: 'whatsapp',
      to: '584140000001',
      type: 'text',
      text: { body: 'Hola', preview_url: false },
    });
  });

  it('traduce el error de Meta a código y detalle', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuesta(400, {
          error: {
            code: 131030,
            message: 'Recipient not allowed',
            error_data: { details: 'not in allowed list' },
          },
        })
      )
    );

    const error = await new GraphWhatsAppCloudAdapter(CONFIG)
      .enviarTexto('584140000001', 'Hola')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ErrorEnvioMeta);
    expect(error).toMatchObject({
      codigo: 131030,
      detalle: 'not in allowed list',
    });
  });

  it('no llama a Meta sin credenciales', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new GraphWhatsAppCloudAdapter({
        ...CONFIG,
        accessToken: null,
      }).enviarTexto('5841', 'Hola')
    ).rejects.toBeInstanceOf(WhatsAppNoConfiguradoException);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
