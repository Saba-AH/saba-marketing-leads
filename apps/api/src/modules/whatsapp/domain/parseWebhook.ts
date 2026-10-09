import { z } from 'zod';
import { InvalidWebhookPayloadException } from './exceptions/InvalidWebhookPayloadException';
import type {
  InboundMessage,
  InboxAction,
  MessageStatus,
  MessageStatusChange,
} from './Inbox';

const PREVIEW_LENGTH = 120;

const TYPES_WITH_MEDIA = new Set([
  'image',
  'video',
  'audio',
  'document',
  'sticker',
]);

// A reaction or a message WhatsApp cannot display does not guarantee Meta
// opens the window: it is treated as closed rather than risking a 131047.
const TYPES_WITHOUT_WINDOW = new Set(['reaction', 'unsupported', 'system']);

const LABELS: Record<string, string> = {
  image: '📷 Imagen',
  video: '🎥 Video',
  audio: '🎤 Audio',
  document: '📄 Documento',
  sticker: 'Sticker',
  location: '📍 Ubicación',
  contacts: '👤 Contacto',
  reaction: 'Reacción',
};

const STATUSES: Record<string, MessageStatus> = {
  sent: 'sent',
  delivered: 'delivered',
  read: 'read',
  failed: 'failed',
};

const optionalText = z.string().min(1).optional();

const messageSchema = z.looseObject({
  id: z.string().min(1),
  from: optionalText,
  from_user_id: optionalText,
  timestamp: z.string().regex(/^\d+$/),
  type: z.string().min(1),
  text: z.looseObject({ body: z.string() }).optional(),
  interactive: z
    .looseObject({
      button_reply: z.looseObject({ title: z.string() }).optional(),
      list_reply: z.looseObject({ title: z.string() }).optional(),
    })
    .optional(),
  button: z.looseObject({ text: z.string() }).optional(),
  reaction: z.looseObject({ emoji: z.string().optional() }).optional(),
  location: z
    .looseObject({
      name: z.string().optional(),
      address: z.string().optional(),
    })
    .optional(),
});

const mediaSchema = z.looseObject({
  id: z.string().optional(),
  caption: z.string().optional(),
});

const statusSchema = z.looseObject({
  id: z.string().min(1),
  status: z.string().min(1),
  errors: z
    .array(
      z.looseObject({
        code: z.union([z.number(), z.string()]),
        title: z.string().optional(),
        message: z.string().optional(),
        error_data: z
          .looseObject({ details: z.string().optional() })
          .optional(),
      })
    )
    .optional(),
});

const valueMessagesSchema = z.looseObject({
  contacts: z
    .array(
      z.looseObject({
        wa_id: optionalText,
        user_id: optionalText,
        profile: z.looseObject({ name: z.string().optional() }).optional(),
      })
    )
    .optional(),
  messages: z.array(z.unknown()).optional(),
  statuses: z.array(z.unknown()).optional(),
});

type Message = z.infer<typeof messageSchema>;
type Contact = NonNullable<
  z.infer<typeof valueMessagesSchema>['contacts']
>[number];

function parse<T extends z.ZodType>(
  schema: T,
  value: unknown,
  what: string
): z.infer<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new InvalidWebhookPayloadException(
      `${what}: ${parsed.error.issues.map((i) => i.path.join('.')).join(', ')}`
    );
  }
  return parsed.data;
}

function bodyOf(message: Message): string | null {
  switch (message.type) {
    case 'text':
      return message.text?.body ?? null;
    case 'interactive':
      return (
        message.interactive?.button_reply?.title ??
        message.interactive?.list_reply?.title ??
        null
      );
    case 'button':
      return message.button?.text ?? null;
    case 'reaction':
      return message.reaction?.emoji ?? null;
    case 'location':
      return message.location?.name ?? message.location?.address ?? null;
    default: {
      if (!TYPES_WITH_MEDIA.has(message.type)) return null;
      const media = mediaSchema.safeParse(message[message.type]);
      return media.success ? (media.data.caption ?? null) : null;
    }
  }
}

function mediaIdOf(message: Message): string | null {
  if (!TYPES_WITH_MEDIA.has(message.type)) return null;
  const media = mediaSchema.safeParse(message[message.type]);
  return media.success ? (media.data.id ?? null) : null;
}

function previewOf(type: string, body: string | null): string {
  const text = body?.trim() || LABELS[type] || 'Mensaje';
  return text.length > PREVIEW_LENGTH
    ? `${text.slice(0, PREVIEW_LENGTH - 1)}…`
    : text;
}

function toInboundMessage(value: unknown, contacts: Contact[]): InboundMessage {
  const message = parse(messageSchema, value, 'messages[]');
  const waId = message.from ?? null;
  const userId = message.from_user_id ?? null;
  if (!waId && !userId) {
    throw new InvalidWebhookPayloadException(
      `messages[] ${message.id}: sin from ni from_user_id`
    );
  }
  const contact = contacts.find(
    (c) =>
      (waId !== null && c.wa_id === waId) ||
      (userId !== null && c.user_id === userId)
  );
  const body = bodyOf(message);
  return {
    wamid: message.id,
    identity: {
      waId: waId ?? contact?.wa_id ?? null,
      userId: userId ?? contact?.user_id ?? null,
    },
    profileName: contact?.profile?.name ?? null,
    type: message.type,
    body,
    mediaId: mediaIdOf(message),
    waTimestamp: new Date(Number(message.timestamp) * 1000),
    preview: previewOf(message.type, body),
    opensWindow: !TYPES_WITHOUT_WINDOW.has(message.type),
  };
}

function toStatusChange(value: unknown): MessageStatusChange | null {
  const status = parse(statusSchema, value, 'statuses[]');
  const next = STATUSES[status.status];
  // `deleted`, `warning` and others Meta may add do not change the send status.
  if (!next) return null;
  const error = status.errors?.[0];
  return {
    wamid: status.id,
    status: next,
    errorCode: error ? String(error.code) : null,
    errorDetail:
      error?.error_data?.details ?? error?.message ?? error?.title ?? null,
  };
}

/**
 * Translates a webhook change into actions on the chats. Fields phase 1 does
 * not process (account, quality, templates, coexistence) return `[]`: the
 * event stays saved and marked as processed.
 */
export function parseWebhook(field: string, payload: unknown): InboxAction[] {
  if (field !== 'messages') return [];

  const value = parse(valueMessagesSchema, payload, 'messages');
  const contacts = value.contacts ?? [];

  const inbound: InboxAction[] = (value.messages ?? []).map((m) => ({
    type: 'inboundMessage',
    message: toInboundMessage(m, contacts),
  }));

  const statuses: InboxAction[] = (value.statuses ?? []).flatMap((s) => {
    const change = toStatusChange(s);
    return change ? [{ type: 'statusChange' as const, change }] : [];
  });

  return [...inbound, ...statuses];
}
