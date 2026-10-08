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
    // Drizzle wraps the `pg` error in `cause` depending on the version.
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

async function createConversation(waId: string): Promise<string> {
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

describe('WhatsApp schema', () => {
  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('resolves contact → conversation → messages in one relational query', async () => {
    const conversationId = await createConversation('584141234567');
    await getTestDb()
      .insert(whatsappMessages)
      .values({
        conversationId,
        wamid: 'wamid.A',
        direction: 'inbound',
        source: 'customer',
        type: 'text',
        body: 'Hola',
        waTimestamp: new Date('2026-10-07T12:00:00Z'),
      });

    const contact = await getTestDb().query.whatsappContacts.findFirst({
      where: eq(whatsappContacts.waId, '584141234567'),
      with: { conversation: { with: { messages: true } } },
    });

    expect(contact?.conversation?.status).toBe('open');
    expect(contact?.conversation?.messages.map((m) => m.body)).toEqual([
      'Hola',
    ]);
  });

  it('allows a single conversation per contact', async () => {
    const conversationId = await createConversation('584141234567');
    const conversation =
      await getTestDb().query.whatsappConversations.findFirst({
        where: eq(whatsappConversations.id, conversationId),
      });

    const code = await pgErrorCode(
      getTestDb()
        .insert(whatsappConversations)
        .values({ contactId: conversation?.contactId ?? '' })
    );

    expect(code).toBe(UNIQUE_VIOLATION);
  });

  it('allows several pending messages without a wamid, but not two with the same one', async () => {
    const conversationId = await createConversation('584141234567');
    const pending = {
      conversationId,
      direction: 'outbound' as const,
      source: 'system' as const,
      type: 'text',
      body: 'Hola',
      status: 'pending' as const,
      waTimestamp: new Date(),
    };
    await getTestDb().insert(whatsappMessages).values([pending, pending]);

    await getTestDb()
      .insert(whatsappMessages)
      .values({ ...pending, wamid: 'wamid.X', status: 'sent' });
    const code = await pgErrorCode(
      getTestDb()
        .insert(whatsappMessages)
        .values({ ...pending, wamid: 'wamid.X', status: 'sent' })
    );

    expect(code).toBe(UNIQUE_VIOLATION);
  });

  it('rejects a template message without a template name or language', async () => {
    const conversationId = await createConversation('584141234567');

    const code = await pgErrorCode(
      getTestDb().insert(whatsappMessages).values({
        conversationId,
        direction: 'outbound',
        source: 'system',
        type: 'template',
        body: 'Hola Juan, te escribimos de Saba',
        waTimestamp: new Date(),
      })
    );

    expect(code).toBe(CHECK_VIOLATION);
  });

  it('requires a phone or user_id on every contact', async () => {
    await getTestDb().insert(whatsappContacts).values({ userId: 'VE.1' });

    const code = await pgErrorCode(
      getTestDb()
        .insert(whatsappContacts)
        .values({ profileName: 'Sin identidad' })
    );

    expect(code).toBe(CHECK_VIOLATION);
  });

  it('deletes conversation and messages when the contact is deleted', async () => {
    const conversationId = await createConversation('584141234567');
    await getTestDb().insert(whatsappMessages).values({
      conversationId,
      direction: 'inbound',
      source: 'customer',
      type: 'text',
      waTimestamp: new Date(),
    });

    await getTestDb()
      .delete(whatsappContacts)
      .where(eq(whatsappContacts.waId, '584141234567'));

    expect(await getTestDb().select().from(whatsappConversations)).toEqual([]);
    expect(await getTestDb().select().from(whatsappMessages)).toEqual([]);
  });
});
