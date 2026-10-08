import React from 'react';

/** Desde `xl` (1280 px) el detalle del contacto va al costado; antes, como panel deslizable. */
const CONSULTA = '(min-width: 1280px)';

function sinSuscripcion(): void {
  // Sin matchMedia (SSR, jsdom) no hay cambios que escuchar.
}

function suscribir(avisar: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia)
    return sinSuscripcion;
  const mql = window.matchMedia(CONSULTA);
  mql.addEventListener('change', avisar);
  return () => mql.removeEventListener('change', avisar);
}

function leer(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    ? window.matchMedia(CONSULTA).matches
    : false;
}

export function useEsPantallaAncha(): boolean {
  return React.useSyncExternalStore(suscribir, leer, () => false);
}
