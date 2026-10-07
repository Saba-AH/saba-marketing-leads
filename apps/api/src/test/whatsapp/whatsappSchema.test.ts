import { eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  whatsappContacts,
  whatsappConversations,
  whatsappMessages,
} from '../../modules/whatsapp/infrastructure/persistence/whatsapp.schema';
import { closeTestDb, getTestDb, resetDatabase } from '../support/testDatabase';

const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';

async function pgErrorCode(
  work: Promise<unknown>
): Promise<string | undefined> {
  try {
    await work;
  } catch (error: unknown) {
    // Drizzle envuelve el error de `pg` en `cause` según la versión.
    const candidates = [
      error,
      error instanceof Error ? error.cause : undefined,
    ];
    for (const candidate of candidates) {
      if (
        typeof candidate === 'object' &&
        candidate !== null &&
        'code' in candidate &&
        typeof candidate.code === 'string'
      ) {
        return candidate.code;
      }
    }
    throw error;
  }
  return undefined;
}

async function crearConversacion(waId: string): Promise<string> {
  const db = getTestDb();
  const [contact] = await db
    .insert(whatsappContacts)
    .values({ waId })
    .returning({ id: whatsappContacts.id });
  if (!contact) throw new Error('no se creó el contacto');
  const [conversation] = await db
    .insert(whatsappConversations)
    .values({ contactId: contact.id })
    .returning({ id: whatsappConversations.id });
  if (!conversation) throw new Error('no se creó la conversación');
  return conversation.id;
}

describe('esquema de WhatsApp', () => {
  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('resuelve contacto → conversación → mensajes en una consulta relacional', async () => {
    const conversationId = await crearConversacion('584141234567');
    await getTestDb()
      .insert(whatsappMessages)
      .values({
        conversationId,
        wamid: 'wamid.A',
        direccion: 'entrante',
        origen: 'cliente',
        tipo: 'text',
        cuerpo: 'Hola',
        waTimestamp: new Date('2026-10-07T12:00:00Z'),
      });

    const contacto = await getTestDb().query.whatsappContacts.findFirst({
      where: eq(whatsappContacts.waId, '584141234567'),
      with: { conversation: { with: { messages: true } } },
    });

    expect(contacto?.conversation?.estado).toBe('abierta');
    expect(contacto?.conversation?.messages.map((m) => m.cuerpo)).toEqual([
      'Hola',
    ]);
  });

  it('admite una sola conversación por contacto', async () => {
    const conversationId = await crearConversacion('584141234567');
    const conversacion =
      await getTestDb().query.whatsappConversations.findFirst({
        where: eq(whatsappConversations.id, conversationId),
      });

    const code = await pgErrorCode(
      getTestDb()
        .insert(whatsappConversations)
        .values({ contactId: conversacion?.contactId ?? '' })
    );

    expect(code).toBe(UNIQUE_VIOLATION);
  });

  it('permite varios mensajes pendientes sin wamid, pero no dos con el mismo', async () => {
    const conversationId = await crearConversacion('584141234567');
    const pendiente = {
      conversationId,
      direccion: 'saliente' as const,
      origen: 'sistema' as const,
      tipo: 'text',
      cuerpo: 'Hola',
      estado: 'pendiente' as const,
      waTimestamp: new Date(),
    };
    await getTestDb().insert(whatsappMessages).values([pendiente, pendiente]);

    await getTestDb()
      .insert(whatsappMessages)
      .values({ ...pendiente, wamid: 'wamid.X', estado: 'enviado' });
    const code = await pgErrorCode(
      getTestDb()
        .insert(whatsappMessages)
        .values({ ...pendiente, wamid: 'wamid.X', estado: 'enviado' })
    );

    expect(code).toBe(UNIQUE_VIOLATION);
  });

  it('rechaza un mensaje de plantilla sin nombre ni idioma de plantilla', async () => {
    const conversationId = await crearConversacion('584141234567');

    const code = await pgErrorCode(
      getTestDb().insert(whatsappMessages).values({
        conversationId,
        direccion: 'saliente',
        origen: 'sistema',
        tipo: 'template',
        cuerpo: 'Hola Juan, te escribimos de Saba',
        waTimestamp: new Date(),
      })
    );

    expect(code).toBe(CHECK_VIOLATION);
  });

  it('borra conversación y mensajes al borrar el contacto', async () => {
    const conversationId = await crearConversacion('584141234567');
    await getTestDb().insert(whatsappMessages).values({
      conversationId,
      direccion: 'entrante',
      origen: 'cliente',
      tipo: 'text',
      waTimestamp: new Date(),
    });

    await getTestDb()
      .delete(whatsappContacts)
      .where(eq(whatsappContacts.waId, '584141234567'));

    expect(await getTestDb().select().from(whatsappConversations)).toEqual([]);
    expect(await getTestDb().select().from(whatsappMessages)).toEqual([]);
  });
});
