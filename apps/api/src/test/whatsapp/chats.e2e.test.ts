import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { BusModule } from '../../bus.module';
import { DrizzleModule } from '../../infrastructure/database/drizzle.module';
import { ErrorsModule } from '../../infrastructure/errors/ErrorsModule';
import { LoggingModule } from '../../infrastructure/logging/LoggingModule';
import type { AuthenticatedUser } from '../../modules/auth/domain/AuthSession';
import { ErrorEnvioMeta } from '../../modules/whatsapp/domain/Chats';
import {
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
} from '../../modules/whatsapp/infrastructure/persistence/whatsapp.schema';
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

const AHORA = new Date('2026-10-07T20:00:00Z');
const HACE_UNA_HORA = new Date(AHORA.getTime() - 60 * 60 * 1000);
const HACE_DOS_DIAS = new Date(AHORA.getTime() - 48 * 60 * 60 * 1000);
const AGENTE: AuthenticatedUser = {
  id: '11111111-1111-1111-1111-111111111111',
  correo: 'agente@sabatransporte.com',
  nombre: 'Agente',
  rol: 'admin',
};

const enviarTexto = vi.fn<(to: string, cuerpo: string) => Promise<string>>();

async function crearChat(datos: {
  waId?: string | null;
  userId?: string | null;
  ultimoEntranteAt: Date | null;
  ultimoMensajeAt?: Date;
  noLeidos?: number;
}): Promise<string> {
  const db = getTestDb();
  const [contacto] = await db
    .insert(whatsappContacts)
    .values({
      waId: datos.waId === undefined ? '584140000001' : datos.waId,
      userId: datos.userId ?? null,
      profileName: 'Cliente',
    })
    .returning();
  if (!contacto) throw new Error('sin contacto');
  const [conversacion] = await db
    .insert(whatsappConversations)
    .values({
      contactId: contacto.id,
      ultimoEntranteAt: datos.ultimoEntranteAt,
      ultimoMensajeAt: datos.ultimoMensajeAt ?? datos.ultimoEntranteAt,
      noLeidos: datos.noLeidos ?? 0,
    })
    .returning();
  if (!conversacion) throw new Error('sin conversación');
  return conversacion.id;
}

describe('chats de WhatsApp (API)', () => {
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
    })
      .overrideProvider(WHATSAPP_TOKENS.WhatsAppCloud)
      .useValue({ enviarTexto })
      .overrideProvider(WHATSAPP_TOKENS.Clock)
      .useValue({ now: () => AHORA })
      .compile();

    app = moduleRef.createNestApplication();
    // Lo que en la app real deja el AuthGuard.
    app.use(
      (
        req: Request & { user?: AuthenticatedUser },
        _res: Response,
        next: NextFunction
      ) => {
        req.user = AGENTE;
        next();
      }
    );
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
    enviarTexto.mockReset();
  });

  it('lista las conversaciones con la de actividad más reciente primero y su ventana', async () => {
    const vieja = await crearChat({
      waId: '584140000001',
      ultimoEntranteAt: HACE_DOS_DIAS,
    });
    const reciente = await crearChat({
      waId: '584140000002',
      ultimoEntranteAt: HACE_UNA_HORA,
      noLeidos: 2,
    });

    const res = await request(app.getHttpServer()).get(
      '/whatsapp/conversaciones'
    );

    expect(res.status).toBe(200);
    expect(res.body.data.map((c: { id: string }) => c.id)).toEqual([
      reciente,
      vieja,
    ]);
    expect(res.body.data[0]).toMatchObject({
      noLeidos: 2,
      contacto: {
        telefono: '584140000002',
        nombreWhatsApp: 'Cliente',
        vinculadoASaba: false,
      },
      ventanaExpiraAt: new Date(
        HACE_UNA_HORA.getTime() + 24 * 3600 * 1000
      ).toISOString(),
    });
  });

  it('devuelve los mensajes en orden cronológico y 404 si la conversación no existe', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
    await getTestDb()
      .insert(whatsappMessages)
      .values([
        {
          conversationId: id,
          wamid: 'w2',
          direccion: 'entrante',
          origen: 'cliente',
          tipo: 'text',
          cuerpo: 'segundo',
          waTimestamp: HACE_UNA_HORA,
        },
        {
          conversationId: id,
          wamid: 'w1',
          direccion: 'entrante',
          origen: 'cliente',
          tipo: 'text',
          cuerpo: 'primero',
          waTimestamp: HACE_DOS_DIAS,
        },
      ]);

    const res = await request(app.getHttpServer()).get(
      `/whatsapp/conversaciones/${id}/mensajes`
    );
    const noExiste = await request(app.getHttpServer()).get(
      '/whatsapp/conversaciones/00000000-0000-0000-0000-000000000000/mensajes'
    );

    expect(res.body.data.map((m: { cuerpo: string }) => m.cuerpo)).toEqual([
      'primero',
      'segundo',
    ]);
    expect(noExiste.status).toBe(404);
  });

  it('responde dentro de la ventana: envía a Meta y guarda el mensaje como enviado', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
    enviarTexto.mockResolvedValue('wamid.RESPUESTA');

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: '  Hola, ¿en qué te ayudo?  ' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      direccion: 'saliente',
      origen: 'sistema',
      cuerpo: 'Hola, ¿en qué te ayudo?',
      estado: 'enviado',
    });
    expect(enviarTexto).toHaveBeenCalledWith(
      '584140000001',
      'Hola, ¿en qué te ayudo?'
    );
    const [guardado] = await getTestDb().select().from(whatsappMessages);
    expect(guardado).toMatchObject({
      wamid: 'wamid.RESPUESTA',
      enviadoPor: AGENTE.id,
    });
    const [conversacion] = await getTestDb()
      .select()
      .from(whatsappConversations);
    expect(conversacion?.ultimoMensajePreview).toBe('Hola, ¿en qué te ayudo?');
  });

  it('no envía con la ventana de 24 h cerrada', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_DOS_DIAS });

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: 'Hola' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('WHATSAPP_VENTANA_CERRADA');
    expect(enviarTexto).not.toHaveBeenCalled();
    expect(await getTestDb().select().from(whatsappMessages)).toEqual([]);
  });

  it('deja el mensaje como fallido y explica el error si Meta lo rechaza', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });
    enviarTexto.mockRejectedValue(
      new ErrorEnvioMeta(131030, 'Recipient phone number not in allowed list')
    );

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: 'Hola' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('WHATSAPP_DESTINATARIO_NO_PERMITIDO');
    expect(res.body.error).toContain('destinatarios permitidos');
    const [guardado] = await getTestDb().select().from(whatsappMessages);
    expect(guardado).toMatchObject({
      estado: 'fallido',
      errorCodigo: '131030',
      errorDetalle: 'Recipient phone number not in allowed list',
    });
  });

  it('no responde a un contacto que solo comparte su nombre de usuario', async () => {
    const id = await crearChat({
      waId: null,
      userId: 'VE.1',
      ultimoEntranteAt: HACE_UNA_HORA,
    });

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: 'Hola' });

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('WHATSAPP_CONTACTO_SIN_TELEFONO');
  });

  it('rechaza un mensaje vacío', async () => {
    const id = await crearChat({ ultimoEntranteAt: HACE_UNA_HORA });

    const res = await request(app.getHttpServer())
      .post(`/whatsapp/conversaciones/${id}/mensajes`)
      .send({ cuerpo: '   ' });

    expect(res.status).toBe(400);
    expect(enviarTexto).not.toHaveBeenCalled();
  });

  it('marca la conversación como leída', async () => {
    const id = await crearChat({
      ultimoEntranteAt: HACE_UNA_HORA,
      noLeidos: 3,
    });

    const res = await request(app.getHttpServer()).post(
      `/whatsapp/conversaciones/${id}/leida`
    );

    expect(res.status).toBe(200);
    const [conversacion] = await getTestDb()
      .select()
      .from(whatsappConversations)
      .where(eq(whatsappConversations.id, id));
    expect(conversacion?.noLeidos).toBe(0);
  });
});
