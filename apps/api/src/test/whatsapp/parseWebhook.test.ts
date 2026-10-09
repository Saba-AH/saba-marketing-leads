import { describe, expect, it } from 'vitest';
import { InvalidWebhookPayloadException } from '../../modules/whatsapp/domain/exceptions/InvalidWebhookPayloadException';
import { statusesThatAdvanceTo } from '../../modules/whatsapp/domain/Inbox';
import { parseWebhook } from '../../modules/whatsapp/domain/parseWebhook';
import { extractChanges } from '../../modules/whatsapp/domain/WebhookChange';
import inboundTextMessage from '../fixtures/whatsapp/inboundTextMessage.json';

function fixtureValue(): unknown {
  const [change] = extractChanges(inboundTextMessage);
  return change?.payload;
}

describe('parseWebhook', () => {
  it('parses the real Meta text message', () => {
    expect(parseWebhook('messages', fixtureValue())).toEqual([
      {
        type: 'inboundMessage',
        message: {
          wamid: 'wamid.FIXTURE_INBOUND_TEXT',
          identity: {
            waId: '584140000001',
            userId: 'VE.0000000000000001',
          },
          profileName: 'Cliente Prueba',
          type: 'text',
          body: 'hola prueba',
          mediaId: null,
          waTimestamp: new Date(1791403246 * 1000),
          preview: 'hola prueba',
          opensWindow: true,
        },
      },
    ]);
  });

  it('identifies by user_id when the customer does not share the phone', () => {
    const [action] = parseWebhook('messages', {
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

    expect(action).toMatchObject({
      message: {
        identity: { waId: null, userId: 'VE.9' },
        profileName: 'Ana',
      },
    });
  });

  it('uses the caption and media_id of an image, and the label if there is no caption', () => {
    const actions = parseWebhook('messages', {
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

    expect(actions).toMatchObject([
      {
        message: {
          body: 'mi cédula',
          mediaId: 'MEDIA1',
          preview: 'mi cédula',
        },
      },
      { message: { body: null, mediaId: 'MEDIA2', preview: '📷 Imagen' } },
    ]);
  });

  it('does not open the window with a reaction', () => {
    const [action] = parseWebhook('messages', {
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

    expect(action).toMatchObject({
      message: { body: '👍', opensWindow: false },
    });
  });

  it('translates delivery statuses and keeps the error of a failed send', () => {
    expect(
      parseWebhook('messages', {
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
        type: 'statusChange',
        change: {
          wamid: 'wamid.A',
          status: 'delivered',
          errorCode: null,
          errorDetail: null,
        },
      },
      {
        type: 'statusChange',
        change: {
          wamid: 'wamid.B',
          status: 'failed',
          errorCode: '131047',
          errorDetail:
            'Message failed to send because more than 24 hours have passed',
        },
      },
    ]);
  });

  it('ignores the fields phase 1 does not process', () => {
    expect(parseWebhook('account_update', { event: 'X' })).toEqual([]);
    expect(parseWebhook('message_template_status_update', {})).toEqual([]);
  });

  it('rejects a message without phone or user_id', () => {
    expect(() =>
      parseWebhook('messages', {
        messages: [{ id: 'wamid.X', timestamp: '1', type: 'text' }],
      })
    ).toThrow(InvalidWebhookPayloadException);
  });
});

describe('statusesThatAdvanceTo', () => {
  it('does not let a status go backwards', () => {
    expect(statusesThatAdvanceTo('sent')).not.toContain('delivered');
    expect(statusesThatAdvanceTo('delivered')).not.toContain('read');
    expect(statusesThatAdvanceTo('failed')).not.toContain('read');
    expect(statusesThatAdvanceTo('read')).toContain('delivered');
  });
});
