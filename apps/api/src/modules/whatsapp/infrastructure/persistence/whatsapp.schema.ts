import { relations, sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * `saba_profile_id`, `tomada_por` y `enviado_por` apuntan a `profiles.id` de
 * Saba sin FK: la tabla es de otro sistema y en Supabase la borra o recrea Saba.
 */

export const whatsappContacts = pgTable(
  'whatsapp_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Solo dígitos, como lo manda Meta (E.164 sin "+").
    waId: text('wa_id').notNull().unique(),
    profileName: text('profile_name'),
    sabaProfileId: uuid('saba_profile_id'),
    vinculoOrigen: text('vinculo_origen', { enum: ['auto', 'manual'] }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    check(
      'whatsapp_contacts_vinculo_origen_check',
      sql`${tabla.vinculoOrigen} IN ('auto', 'manual')`
    ),
  ]
);

export const whatsappConversations = pgTable(
  'whatsapp_conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contactId: uuid('contact_id')
      .notNull()
      .unique()
      .references(() => whatsappContacts.id, { onDelete: 'cascade' }),
    estado: text('estado', { enum: ['abierta', 'resuelta'] })
      .notNull()
      .default('abierta'),
    tomadaPor: uuid('tomada_por'),
    tomadaAt: timestamp('tomada_at', { withTimezone: true }),
    ultimoMensajeAt: timestamp('ultimo_mensaje_at', { withTimezone: true }),
    // La ventana de 24 h se calcula desde acá: solo la mueven entrantes en vivo.
    ultimoEntranteAt: timestamp('ultimo_entrante_at', { withTimezone: true }),
    ultimoMensajePreview: text('ultimo_mensaje_preview'),
    noLeidos: integer('no_leidos').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    check(
      'whatsapp_conversations_estado_check',
      sql`${tabla.estado} IN ('abierta', 'resuelta')`
    ),
    index('whatsapp_conversations_estado_ultimo_mensaje_idx').on(
      tabla.estado,
      tabla.ultimoMensajeAt.desc()
    ),
    index('whatsapp_conversations_tomada_por_idx').on(tabla.tomadaPor),
  ]
);

export const whatsappMessages = pgTable(
  'whatsapp_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => whatsappConversations.id, { onDelete: 'cascade' }),
    // NULL mientras el envío está pendiente: Meta asigna el wamid al aceptarlo.
    wamid: text('wamid').unique(),
    direccion: text('direccion', { enum: ['entrante', 'saliente'] }).notNull(),
    origen: text('origen', {
      enum: ['cliente', 'sistema', 'celular', 'historial'],
    }).notNull(),
    // Tipo de Meta (text, image, audio, template, …): abierto porque Meta suma tipos.
    tipo: text('tipo').notNull(),
    // En plantillas, el cuerpo con las variables ya reemplazadas.
    cuerpo: text('cuerpo'),
    mediaId: text('media_id'),
    enviadoPor: uuid('enviado_por'),
    estado: text('estado', {
      enum: ['pendiente', 'enviado', 'entregado', 'leido', 'fallido'],
    }),
    errorCodigo: text('error_codigo'),
    errorDetalle: text('error_detalle'),
    plantillaNombre: text('plantilla_nombre'),
    plantillaIdioma: text('plantilla_idioma'),
    plantillaCategoria: text('plantilla_categoria'),
    waTimestamp: timestamp('wa_timestamp', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    check(
      'whatsapp_messages_direccion_check',
      sql`${tabla.direccion} IN ('entrante', 'saliente')`
    ),
    check(
      'whatsapp_messages_origen_check',
      sql`${tabla.origen} IN ('cliente', 'sistema', 'celular', 'historial')`
    ),
    check(
      'whatsapp_messages_estado_check',
      sql`${tabla.estado} IN ('pendiente', 'enviado', 'entregado', 'leido', 'fallido')`
    ),
    check(
      'whatsapp_messages_plantilla_check',
      sql`${tabla.tipo} <> 'template' OR (${tabla.plantillaNombre} IS NOT NULL AND ${tabla.plantillaIdioma} IS NOT NULL)`
    ),
    index('whatsapp_messages_conversation_wa_timestamp_idx').on(
      tabla.conversationId,
      tabla.waTimestamp.desc()
    ),
  ]
);

export const whatsappWebhookEvents = pgTable(
  'whatsapp_webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Sin CHECK: Meta agrega campos de webhook y el evento se guarda igual.
    campo: text('campo').notNull(),
    payload: jsonb('payload').notNull(),
    recibidoAt: timestamp('recibido_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    procesadoAt: timestamp('procesado_at', { withTimezone: true }),
    intentos: integer('intentos').notNull().default(0),
    error: text('error'),
  },
  (tabla) => [
    index('whatsapp_webhook_events_pendientes_idx')
      .on(tabla.recibidoAt)
      .where(sql`${tabla.procesadoAt} IS NULL`),
  ]
);

export const whatsappAccounts = pgTable(
  'whatsapp_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    wabaId: text('waba_id').notNull(),
    phoneNumberId: text('phone_number_id').notNull().unique(),
    displayPhone: text('display_phone'),
    estado: text('estado', { enum: ['conectado', 'desconectado'] }).notNull(),
    motivoDesconexion: text('motivo_desconexion'),
    historialSolicitadoAt: timestamp('historial_solicitado_at', {
      withTimezone: true,
    }),
    contactosSolicitadosAt: timestamp('contactos_solicitados_at', {
      withTimezone: true,
    }),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (tabla) => [
    check(
      'whatsapp_accounts_estado_check',
      sql`${tabla.estado} IN ('conectado', 'desconectado')`
    ),
  ]
);

export const whatsappContactsRelations = relations(
  whatsappContacts,
  ({ one }) => ({
    conversation: one(whatsappConversations),
  })
);

export const whatsappConversationsRelations = relations(
  whatsappConversations,
  ({ one, many }) => ({
    contact: one(whatsappContacts, {
      fields: [whatsappConversations.contactId],
      references: [whatsappContacts.id],
    }),
    messages: many(whatsappMessages),
  })
);

export const whatsappMessagesRelations = relations(
  whatsappMessages,
  ({ one }) => ({
    conversation: one(whatsappConversations, {
      fields: [whatsappMessages.conversationId],
      references: [whatsappConversations.id],
    }),
  })
);
