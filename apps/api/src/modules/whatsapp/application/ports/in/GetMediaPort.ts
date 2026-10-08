import type { MediaFile } from '../../../domain/Chats';

export interface GetMediaPort {
  execute(messageId: string): Promise<MediaFile>;
}
