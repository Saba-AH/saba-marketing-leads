import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { ProcesarWebhookEventoUseCase } from '../../modules/whatsapp/application/use-cases/ProcesarWebhookEventoUseCase';
import {
  MAX_INTENTOS,
  ReprocesarPendientesUseCase,
} from '../../modules/whatsapp/application/use-cases/ReprocesarPendientesUseCase';
import { extraerCambios } from '../../modules/whatsapp/domain/WebhookCambio';
import { DrizzleInboxUnitOfWork } from '../../modules/whatsapp/infrastructure/persistence/DrizzleInboxUnitOfWork';
import { DrizzleWebhookEventRepository } from '../../modules/whatsapp/infrastructure/persistence/DrizzleWebhookEventRepository';
import {
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
  whatsappWebhookEvents,
} from '../../modules/whatsapp/infrastructure/persistence/whatsapp.schema';
import mensajeTextoEntrante from '../fixtures/whatsapp/mensajeTextoEntrante.json';
import { closeTestDb, getTestDb, resetDatabase } from '../support/testDatabase';

const db = () => getTestDb();
const eventos = () => new DrizzleWebhookEventRepository(db());
const procesar = () =>
  new ProcesarWebhookEventoUseCase(new DrizzleInboxUnitOfWork(db()), eventos());

async function guardarEvento(campo: string, payload: unknown): Promise<string> {
  const [id] = await eventos().guardar([{ campo, payload }]);
  if (!id) throw new Error('no se guardó el evento');
  return id;
}

async function guardarFixture(): Promise<string> {
  const [cambio] = extraerCambios(mensajeTextoEntrante);
  if (!cambio) throw new Error('fixture vacío');
  return guardarEvento(cambio.campo, cambio.payload);
}

function mensajeDeTexto(
  wamid: string,
  timestamp: number,
  identidad: { from?: string; from_user_id?: string },
  body = 'hola'
): unknown {
  return {
    messages: [
      {
        id: wamid,
        ...identidad,
        timestamp: String(timestamp),
        type: 'text',
        text: { body },
      },
    ],
  };
}

const T0 = 1791403246;

describe('ProcesarWebhookEventoUseCase (contra Postgres)', () => {
  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('crea contacto, conversación y mensaje desde el webhook real, y marca el evento', async () => {
    const eventoId = await guardarFixture();

    expect(await procesar().execute(eventoId)).toBe('procesado');

    const contacto = await db().query.whatsappContacts.findFirst({
      with: { conversation: { with: { messages: true } } },
    });
    expect(contacto).toMatchObject({
      waId: '584140000001',
      userId: 'VE.0000000000000001',
      profileName: 'Cliente Prueba',
      conversation: {
        estado: 'abierta',
        noLeidos: 1,
        ultimoMensajePreview: 'hola prueba',
        ultimoEntranteAt: new Date(T0 * 1000),
        ultimoMensajeAt: new Date(T0 * 1000),
      },
    });
    expect(contacto?.conversation?.messages).toMatchObject([
      {
        wamid: 'wamid.FIXTURE_TEXTO_ENTRANTE',
        direccion: 'entrante',
        origen: 'cliente',
        tipo: 'text',
        cuerpo: 'hola prueba',
      },
    ]);
    const [evento] = await db()
      .select()
      .from(whatsappWebhookEvents)
      .where(eq(whatsappWebhookEvents.id, eventoId));
    expect(evento?.procesadoAt).not.toBeNull();
  });

  it('no duplica nada si Meta reenvía el mismo mensaje ni si el evento se procesa dos veces', async () => {
    const primero = await guardarFixture();
    await procesar().execute(primero);

    expect(await procesar().execute(primero)).toBe('omitido');
    const reenvio = await guardarFixture();
    expect(await procesar().execute(reenvio)).toBe('procesado');

    expect(await db().select().from(whatsappMessages)).toHaveLength(1);
    const [conversacion] = await db().select().from(whatsappConversations);
    expect(conversacion?.noLeidos).toBe(1);
  });

  it('reconoce al mismo cliente cuando después solo llega su user_id', async () => {
    await procesar().execute(
      await guardarEvento(
        'messages',
        mensajeDeTexto('wamid.1', T0, {
          from: '584140000001',
          from_user_id: 'VE.1',
        })
      )
    );
    await procesar().execute(
      await guardarEvento(
        'messages',
        mensajeDeTexto('wamid.2', T0 + 60, { from_user_id: 'VE.1' })
      )
    );

    expect(await db().select().from(whatsappContacts)).toHaveLength(1);
    expect(await db().select().from(whatsappMessages)).toHaveLength(2);
  });

  it('completa el user_id de un contacto que solo tenía teléfono', async () => {
    await procesar().execute(
      await guardarEvento(
        'messages',
        mensajeDeTexto('wamid.1', T0, { from: '584140000001' })
      )
    );
    await procesar().execute(
      await guardarEvento(
        'messages',
        mensajeDeTexto('wamid.2', T0 + 60, {
          from: '584140000001',
          from_user_id: 'VE.1',
        })
      )
    );

    const contactos = await db().select().from(whatsappContacts);
    expect(contactos).toMatchObject([{ waId: '584140000001', userId: 'VE.1' }]);
  });

  it('reabre una conversación resuelta y un mensaje atrasado no pisa la vista previa', async () => {
    await procesar().execute(
      await guardarEvento(
        'messages',
        mensajeDeTexto(
          'wamid.nuevo',
          T0 + 60,
          { from: '584140000001' },
          'último'
        )
      )
    );
    await db()
      .update(whatsappConversations)
      .set({ estado: 'resuelta', noLeidos: 0 });

    await procesar().execute(
      await guardarEvento(
        'messages',
        mensajeDeTexto('wamid.viejo', T0, { from: '584140000001' }, 'anterior')
      )
    );

    const [conversacion] = await db().select().from(whatsappConversations);
    expect(conversacion).toMatchObject({
      estado: 'abierta',
      noLeidos: 1,
      ultimoMensajePreview: 'último',
      ultimoMensajeAt: new Date((T0 + 60) * 1000),
      ultimoEntranteAt: new Date((T0 + 60) * 1000),
    });
  });

  it('avanza el estado de un mensaje saliente sin retroceder', async () => {
    await procesar().execute(
      await guardarEvento(
        'messages',
        mensajeDeTexto('wamid.in', T0, { from: '584140000001' })
      )
    );
    const [conversacion] = await db().select().from(whatsappConversations);
    if (!conversacion) throw new Error('sin conversación');
    await db().insert(whatsappMessages).values({
      conversationId: conversacion.id,
      wamid: 'wamid.out',
      direccion: 'saliente',
      origen: 'sistema',
      tipo: 'text',
      cuerpo: 'respuesta',
      estado: 'enviado',
      waTimestamp: new Date(),
    });

    for (const status of ['read', 'delivered', 'sent']) {
      await procesar().execute(
        await guardarEvento('messages', {
          statuses: [{ id: 'wamid.out', status }],
        })
      );
    }

    const [saliente] = await db()
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.wamid, 'wamid.out'));
    expect(saliente?.estado).toBe('leido');
  });

  it('deja el evento sin procesar, con el motivo, si el payload no sirve', async () => {
    const eventoId = await guardarEvento('messages', {
      messages: [{ id: 'wamid.X', timestamp: '1', type: 'text' }],
    });

    expect(await procesar().execute(eventoId)).toBe('fallido');

    const [evento] = await db()
      .select()
      .from(whatsappWebhookEvents)
      .where(eq(whatsappWebhookEvents.id, eventoId));
    expect(evento).toMatchObject({ procesadoAt: null, intentos: 1 });
    expect(evento?.error).toContain('WHATSAPP_PAYLOAD_WEBHOOK_INVALIDO');
    expect(await db().select().from(whatsappContacts)).toEqual([]);
  });
});

describe('ReprocesarPendientesUseCase (contra Postgres)', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await closeTestDb();
  });

  it('procesa los pendientes y deja de reintentar los que agotaron sus intentos', async () => {
    const pendiente = await guardarFixture();
    const agotado = await guardarEvento('account_update', {});
    await db()
      .update(whatsappWebhookEvents)
      .set({ intentos: MAX_INTENTOS })
      .where(eq(whatsappWebhookEvents.id, agotado));

    const procesados = await new ReprocesarPendientesUseCase(
      eventos(),
      procesar()
    ).execute();

    expect(procesados).toBe(1);
    const filas = await db().select().from(whatsappWebhookEvents);
    expect(filas.find((f) => f.id === pendiente)?.procesadoAt).not.toBeNull();
    expect(filas.find((f) => f.id === agotado)?.procesadoAt).toBeNull();
  });
});
