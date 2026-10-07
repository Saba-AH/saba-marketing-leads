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

  it('baja un archivo en dos pasos, los dos con el token', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith('/MEDIA1')
        ? respuesta(200, {
            url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1',
            mime_type: 'image/jpeg',
            file_size: 4,
          })
        : new Response('foto', { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const archivo = await new GraphWhatsAppCloudAdapter(CONFIG).descargarMedia(
      'MEDIA1'
    );

    expect(archivo).toMatchObject({ mimeType: 'image/jpeg', tamano: 4 });
    expect(await new Response(archivo.contenido).text()).toBe('foto');
    const llamadas = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(llamadas.map(([url]) => url)).toEqual([
      'https://graph.facebook.com/v26.0/MEDIA1',
      'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1',
    ]);
    for (const [, init] of llamadas) {
      expect(init.headers).toMatchObject({ Authorization: 'Bearer token' });
    }
  });

  it('reporta el error de Meta si el archivo ya no existe', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        respuesta(400, {
          error: { code: 100, message: 'Unsupported get request' },
        })
      )
    );

    await expect(
      new GraphWhatsAppCloudAdapter(CONFIG).descargarMedia('MEDIA_VIEJO')
    ).rejects.toMatchObject({ codigo: 100 });
  });
});
