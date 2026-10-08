export type MessageStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

/** At least one of the two always comes; with a username the phone may be missing. */
export interface ContactIdentity {
  waId: string | null;
  userId: string | null;
}

export interface InboundMessage {
  wamid: string;
  identity: ContactIdentity;
  profileName: string | null;
  type: string;
  body: string | null;
  mediaId: string | null;
  waTimestamp: Date;
  /** What shows in the conversation list. */
  preview: string;
  /** Whether it opens (or renews) the 24 h window to reply with free text. */
  opensWindow: boolean;
}

export interface MessageStatusChange {
  wamid: string;
  status: MessageStatus;
  errorCode: string | null;
  errorDetail: string | null;
}

export type InboxAction =
  | { type: 'inboundMessage'; message: InboundMessage }
  | { type: 'statusChange'; change: MessageStatusChange };

/**
 * Statuses from which a message can move to `next`. Meta does not guarantee
 * the order of the notifications: a "delivered" arriving after "read" does not
 * go backwards.
 */
export function statusesThatAdvanceTo(next: MessageStatus): MessageStatus[] {
  switch (next) {
    case 'pending':
      return [];
    case 'sent':
      return ['pending'];
    case 'delivered':
      return ['pending', 'sent'];
    case 'read':
      return ['pending', 'sent', 'delivered'];
    case 'failed':
      return ['pending', 'sent'];
  }
}
