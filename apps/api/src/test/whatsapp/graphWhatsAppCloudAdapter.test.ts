import { afterEach, describe, expect, it, vi } from 'vitest';
import { MetaSendError } from '../../modules/whatsapp/domain/Chats';
import { WhatsAppNotConfiguredException } from '../../modules/whatsapp/domain/exceptions/whatsappExceptions';
import { GraphWhatsAppCloudAdapter } from '../../modules/whatsapp/infrastructure/external/GraphWhatsAppCloudAdapter';
import type { WhatsAppConfig } from '../../modules/whatsapp/infrastructure/whatsappConfig';

const CONFIG: WhatsAppConfig = {
  appSecret: null,
  verifyToken: null,
  accessToken: 'token',
  phoneNumberId: '1014761568397246',
  graphVersion: 'v26.0',
};

function response(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('GraphWhatsAppCloudAdapter', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the text to the number and returns the wamid', async () => {
    const fetchMock = vi.fn(async () =>
      response(200, { messages: [{ id: 'wamid.OK' }] })
    );
    vi.stubGlobal('fetch', fetchMock);

    const wamid = await new GraphWhatsAppCloudAdapter(CONFIG).sendText(
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

  it('translates the Meta error into code and detail', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        response(400, {
          error: {
            code: 131030,
            message: 'Recipient not allowed',
            error_data: { details: 'not in allowed list' },
          },
        })
      )
    );

    const error = await new GraphWhatsAppCloudAdapter(CONFIG)
      .sendText('584140000001', 'Hola')
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(MetaSendError);
    expect(error).toMatchObject({
      code: 131030,
      detail: 'not in allowed list',
    });
  });

  it('does not call Meta without credentials', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new GraphWhatsAppCloudAdapter({
        ...CONFIG,
        accessToken: null,
      }).sendText('5841', 'Hola')
    ).rejects.toBeInstanceOf(WhatsAppNotConfiguredException);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('downloads a file in two steps, both with the token', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.endsWith('/MEDIA1')
        ? response(200, {
            url: 'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1',
            mime_type: 'image/jpeg',
            file_size: 4,
          })
        : new Response('foto', { status: 200 })
    );
    vi.stubGlobal('fetch', fetchMock);

    const file = await new GraphWhatsAppCloudAdapter(CONFIG).downloadMedia(
      'MEDIA1'
    );

    expect(file).toMatchObject({ mimeType: 'image/jpeg', size: 4 });
    expect(await new Response(file.content).text()).toBe('foto');
    const calls = fetchMock.mock.calls as unknown as [string, RequestInit][];
    expect(calls.map(([url]) => url)).toEqual([
      'https://graph.facebook.com/v26.0/MEDIA1',
      'https://lookaside.fbsbx.com/whatsapp_business/attachments/?mid=1',
    ]);
    for (const [, init] of calls) {
      expect(init.headers).toMatchObject({ Authorization: 'Bearer token' });
    }
  });

  it('reports the Meta error if the file no longer exists', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        response(400, {
          error: { code: 100, message: 'Unsupported get request' },
        })
      )
    );

    await expect(
      new GraphWhatsAppCloudAdapter(CONFIG).downloadMedia('MEDIA_VIEJO')
    ).rejects.toMatchObject({ code: 100 });
  });

  it('sends the typing indicator tied to the customer message', async () => {
    const fetchMock = vi.fn(async () => response(200, { success: true }));
    vi.stubGlobal('fetch', fetchMock);

    await new GraphWhatsAppCloudAdapter(CONFIG).sendTypingIndicator('wamid.IN');

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(
      'https://graph.facebook.com/v26.0/1014761568397246/messages'
    );
    expect(JSON.parse(String(init.body))).toEqual({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: 'wamid.IN',
      typing_indicator: { type: 'text' },
    });
  });
});
