import React from 'react';

/** From `xl` (1280 px) the contact detail goes on the side; below that, as a sliding panel. */
const MEDIA_QUERY = '(min-width: 1280px)';

function unsubscribed(): void {
  // Without matchMedia (SSR, jsdom) there are no changes to listen to.
}

function subscribe(notify: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return unsubscribed;
  const mql = window.matchMedia(MEDIA_QUERY);
  mql.addEventListener('change', notify);
  return () => mql.removeEventListener('change', notify);
}

function read(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    ? window.matchMedia(MEDIA_QUERY).matches
    : false;
}

export function useIsWideScreen(): boolean {
  return React.useSyncExternalStore(subscribe, read, () => false);
}
