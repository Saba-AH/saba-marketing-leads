import { useMutation } from '@tanstack/react-query';
import React from 'react';
import {
  SHOW_TYPING_TO_CUSTOMER,
  TYPING_NOTICE_INTERVAL_MS,
} from '../../domain/chatsConfig';
import { ChatsService } from '../../infrastructure';

/**
 * Returns `notify()` to call on every keystroke: it tells Meta at most once
 * every 20 s per conversation. Failures show nothing: it is a courtesy.
 */
export function useTypingNotice(conversationId: string): () => void {
  const lastNoticeRef = React.useRef(0);
  const { mutate } = useMutation({
    mutationFn: () => ChatsService.sendTypingIndicator(conversationId),
  });

  return React.useCallback(() => {
    if (!SHOW_TYPING_TO_CUSTOMER) return;
    const now = Date.now();
    if (now - lastNoticeRef.current < TYPING_NOTICE_INTERVAL_MS) return;
    lastNoticeRef.current = now;
    mutate();
  }, [mutate]);
}
