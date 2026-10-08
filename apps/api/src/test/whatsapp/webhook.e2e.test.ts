import { createHmac } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { EventsHandler, type IEventHandler } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BusModule } from '../../bus.module';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { ErrorsModule } from '../../infrastructure/errors/ErrorsModule';
import { LoggingModule } from '../../infrastructure/logging/LoggingModule';
import { WebhookEventReceived } from '../../modules/whatsapp/domain/events/WebhookEventReceived';
import { whatsappWebhookEvents } from '../../modules/whatsapp/infrastructure/persistence/whatsapp.schema';
import type { WhatsAppConfig } from '../../modules/whatsapp/infrastructure/whatsappConfig';
import { WhatsAppModule } from '../../modules/whatsapp/module';
import { WHATSAPP_TOKENS } from '../../modules/whatsapp/tokens';
import { ZodValidationPipe } from '../../shared/pipes/zodValidationPipe';
import {
  closeTestDb,
  getTestDb,
  resetDatabase,
  testDatabaseUrl,
} from '../support/testDatabase';

process.env.DATABASE = testDatabaseUrl();

const CONFIG: WhatsAppConfig = {
  appSecret: 'app-secret',
  verifyToken: 'verify-token',
  accessToken: null,
  phoneNumberId: null,
  graphVersion: 'v26.0',
};

const published: string[] = [];
let failingHandler = false;

@EventsHandler(WebhookEventReceived)
class TestHandler implements IEventHandler<WebhookEventReceived> {
  handle(event: WebhookEventReceived): void {
    if (failingHandler) throw new Error('el procesador explotó');
    published.push(event.eventId);
  }
}

// Real shape of an inbound text message (developers.facebook.com, WhatsApp webhooks).
const textWebhook = JSON.stringify({
  object: 'whatsapp_business_account',
  entry: [
    {
      id: '1293126782760816',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15556346598',
              phone_number_id: '1014761568397246',
            },
            contacts: [{ profile: { name: 'Juan' }, wa_id: '584141234567' }],
            messages: [
              {
                from: '584141234567',
                id: 'wamid.HBgM',
                timestamp: '1791400000',
                type: 'text',
                text: { body: 'Hola' },
              },
            ],
          },
        },
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            statuses: [{ id: 'wamid.OUT', status: 'delivered' }],
          },
        },
      ],
    },
  ],
});

function sign(body: string, secret: string = CONFIG.appSecret ?? ''): string {
  return `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
}

describe('WhatsApp webhook', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        LoggingModule,
        ErrorsModule,
        DrizzleModule,
        BusModule,
        WhatsAppModule,
      ],
      providers: [TestHandler],
    })
      .overrideProvider(WHATSAPP_TOKENS.Config)
      .useValue(CONFIG)
      // Reception is tested here: background processing would clash with the
      // TRUNCATE between tests (it has its own test).
      .overrideProvider(WHATSAPP_TOKENS.ProcessWebhookEvent)
      .useValue({ execute: async () => 'skipped' })
      .overrideProvider(WHATSAPP_TOKENS.ReprocessPending)
      .useValue({ execute: async () => 0 })
      .compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
    published.length = 0;
    failingHandler = false;
  });

  function send(body: string, signature?: string) {
    const req = request(app.getHttpServer())
      .post('/whatsapp/webhook')
      .set('Content-Type', 'application/json');
    if (signature) req.set('X-Hub-Signature-256', signature);
    return req.send(body);
  }

  describe('GET (subscription)', () => {
    it('returns the challenge as plain text if the verify token matches', async () => {
      const res = await request(app.getHttpServer())
        .get('/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': CONFIG.verifyToken,
          'hub.challenge': '1158201444',
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/^text\/plain/);
      expect(res.text).toBe('1158201444');
    });

    it('answers 403 if the verify token does not match', async () => {
      const res = await request(app.getHttpServer())
        .get('/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'other',
          'hub.challenge': '1158201444',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('WHATSAPP_WEBHOOK_SUBSCRIPTION_REJECTED');
    });
  });

  describe('POST (eventos)', () => {
    it('saves one event per change, publishes it and answers 200', async () => {
      const res = await send(textWebhook, sign(textWebhook));

      expect(res.status).toBe(200);
      const rows = await getTestDb().select().from(whatsappWebhookEvents);
      expect(rows).toHaveLength(2);
      expect(rows.every((f) => f.field === 'messages')).toBe(true);
      expect(rows.map((f) => f.payload)).toContainEqual(
        expect.objectContaining({
          messages: [expect.objectContaining({ id: 'wamid.HBgM' })],
        })
      );
      expect(published.sort()).toEqual(rows.map((f) => f.id).sort());
    });

    it.each([
      ['ausente', undefined],
      ['from another secret', sign(textWebhook, 'other')],
      ['from another body', sign('{}')],
    ])(
      'answers 401 without saving anything with a %s signature',
      async (_case, signature) => {
        const res = await send(textWebhook, signature);

        expect(res.status).toBe(401);
        expect(await getTestDb().select().from(whatsappWebhookEvents)).toEqual(
          []
        );
      }
    );

    it('answers 200 even if the event processor fails', async () => {
      failingHandler = true;

      const res = await send(textWebhook, sign(textWebhook));

      expect(res.status).toBe(200);
      expect(
        await getTestDb().select().from(whatsappWebhookEvents)
      ).toHaveLength(2);
    });
  });
});
