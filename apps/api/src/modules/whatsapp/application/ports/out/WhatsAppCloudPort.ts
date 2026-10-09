import type { MediaFile } from '../../../domain/Chats';

export interface WhatsAppCloudPort {
  /**
   * Returns the `wamid` Meta accepted the message with. Throws `MetaSendError`
   * if Meta rejects it and `WhatsAppNotConfiguredException` if credentials are
   * missing.
   */
  sendText(to: string, body: string): Promise<string>;
  /** Throws `MetaSendError` if Meta no longer has it (it keeps it ~30 days). */
  downloadMedia(mediaId: string): Promise<MediaFile>;
  /**
   * Shows "typing…" to the customer (up to 25 s or until the reply arrives).
   * Meta ties it to marking that message as read: the customer sees the blue
   * ticks.
   */
  sendTypingIndicator(inboundWamid: string): Promise<void>;
}
