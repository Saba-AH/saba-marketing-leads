'use client';

import { FileDown } from 'lucide-react';
import React from 'react';
import {
  type MediaShape,
  type Message,
  noticeWithoutText,
} from '../../domain/chat.model';
import { AttachedImage } from './AttachedImage';

/**
 * The file is only requested when shown (`loading="lazy"`, `preload="none"`).
 * If Meta no longer has it (~30 days), it falls back to the "see it on the
 * phone" notice.
 */
export function MessageAttachment({
  message,
  shape,
  url,
  onOpenImage,
}: {
  message: Message;
  shape: MediaShape;
  url: string;
  onOpenImage?: (messageId: string) => void;
}): React.JSX.Element {
  const [unavailable, setUnavailable] = React.useState(false);
  const markUnavailable = (): void => setUnavailable(true);

  if (unavailable) {
    return (
      <p className="italic opacity-80">
        {noticeWithoutText(message.type)} (ya no está en WhatsApp)
      </p>
    );
  }

  switch (shape) {
    case 'image':
      return (
        <AttachedImage
          url={url}
          sticker={message.type === 'sticker'}
          onError={markUnavailable}
          onOpen={
            message.type === 'image' && onOpenImage
              ? () => onOpenImage(message.id)
              : undefined
          }
        />
      );
    case 'audio':
      return (
        <audio
          controls
          preload="none"
          src={url}
          onError={markUnavailable}
          className="w-64 max-w-full"
        />
      );
    case 'video':
      return (
        <video
          controls
          preload="none"
          src={url}
          onError={markUnavailable}
          className="max-h-72 max-w-full rounded-md"
        />
      );
    case 'document':
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-2 underline underline-offset-2"
        >
          <FileDown aria-hidden="true" className="size-4" />
          Abrir documento
        </a>
      );
  }
}
