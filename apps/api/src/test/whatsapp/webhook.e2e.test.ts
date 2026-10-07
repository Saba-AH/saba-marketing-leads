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
import { WebhookEventoRecibido } from '../../modules/whatsapp/domain/events/WebhookEventoRecibido';
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

const publicados: string[] = [];
let handlerFalla = false;

@EventsHandler(WebhookEventoRecibido)
class HandlerDePrueba implements IEventHandler<WebhookEventoRecibido> {
  handle(evento: WebhookEventoRecibido): void {
    if (handlerFalla) throw new Error('el procesador explotó');
    publicados.push(evento.eventoId);
  }
}

// Forma real de un mensaje de texto entrante (developers.facebook.com, webhooks de WhatsApp).
const webhookTexto = JSON.stringify({
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

function firmar(
  body: string,
  secreto: string = CONFIG.appSecret ?? ''
): string {
  return `sha256=${createHmac('sha256', secreto).update(body).digest('hex')}`;
}

describe('webhook de WhatsApp', () => {
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
      providers: [HandlerDePrueba],
    })
      .overrideProvider(WHATSAPP_TOKENS.Config)
      .useValue(CONFIG)
      // Acá se prueba la recepción: el procesamiento en segundo plano chocaría
      // con el TRUNCATE entre tests (tiene su propio test).
      .overrideProvider(WHATSAPP_TOKENS.ProcesarWebhookEvento)
      .useValue({ execute: async () => 'omitido' })
      .overrideProvider(WHATSAPP_TOKENS.ReprocesarPendientes)
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
    publicados.length = 0;
    handlerFalla = false;
  });

  function enviar(body: string, firma?: string) {
    const req = request(app.getHttpServer())
      .post('/whatsapp/webhook')
      .set('Content-Type', 'application/json');
    if (firma) req.set('X-Hub-Signature-256', firma);
    return req.send(body);
  }

  describe('GET (suscripción)', () => {
    it('devuelve el challenge en texto plano si el verify token coincide', async () => {
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

    it('responde 403 si el verify token no coincide', async () => {
      const res = await request(app.getHttpServer())
        .get('/whatsapp/webhook')
        .query({
          'hub.mode': 'subscribe',
          'hub.verify_token': 'otro',
          'hub.challenge': '1158201444',
        });

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('WHATSAPP_SUSCRIPCION_WEBHOOK_RECHAZADA');
    });
  });

  describe('POST (eventos)', () => {
    it('guarda un evento por cambio, lo publica y responde 200', async () => {
      const res = await enviar(webhookTexto, firmar(webhookTexto));

      expect(res.status).toBe(200);
      const filas = await getTestDb().select().from(whatsappWebhookEvents);
      expect(filas).toHaveLength(2);
      expect(filas.every((f) => f.campo === 'messages')).toBe(true);
      expect(filas.map((f) => f.payload)).toContainEqual(
        expect.objectContaining({
          messages: [expect.objectContaining({ id: 'wamid.HBgM' })],
        })
      );
      expect(publicados.sort()).toEqual(filas.map((f) => f.id).sort());
    });

    it.each([
      ['ausente', undefined],
      ['de otro secreto', firmar(webhookTexto, 'otro')],
      ['de otro cuerpo', firmar('{}')],
    ])(
      'responde 401 sin guardar nada con una firma %s',
      async (_caso, firma) => {
        const res = await enviar(webhookTexto, firma);

        expect(res.status).toBe(401);
        expect(await getTestDb().select().from(whatsappWebhookEvents)).toEqual(
          []
        );
      }
    );

    it('responde 200 aunque el procesador del evento falle', async () => {
      handlerFalla = true;

      const res = await enviar(webhookTexto, firmar(webhookTexto));

      expect(res.status).toBe(200);
      expect(
        await getTestDb().select().from(whatsappWebhookEvents)
      ).toHaveLength(2);
    });
  });
});
