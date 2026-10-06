'use client';

import React from 'react';
import {
  ELEMENTOS_POR_PAGINA,
  totalDePaginas,
} from '@/shared/domain/paginacion';

interface Paginacion<T> {
  /** Los elementos de la página actual. */
  visibles: T[];
  pagina: number;
  totalPaginas: number;
  irA: (pagina: number) => void;
  /** Índice humano del primero y el último de la página, para "Mostrando X–Y". */
  desde: number;
  hasta: number;
  total: number;
}

/**
 * `clave` describe el criterio que produjo la lista (filtros + búsqueda).
 * Cuando cambia se vuelve a la página 1: sin eso, alguien parado en la página 4
 * que filtra hasta dejar una sola página vería un listado vacío sin entender
 * por qué.
 *
 * Se ajusta durante el render y no en un efecto, para que no se llegue a pintar
 * la página inválida.
 */
export function usePaginacion<T>(
  elementos: readonly T[],
  clave: string
): Paginacion<T> {
  const [pagina, setPagina] = React.useState(1);
  const [claveAnterior, setClaveAnterior] = React.useState(clave);

  if (clave !== claveAnterior) {
    setClaveAnterior(clave);
    setPagina(1);
  }

  const totalPaginas = totalDePaginas(elementos.length);
  // Si los datos se achican por debajo de la página actual (alguien borró un
  // registro), la última válida manda.
  const paginaActual = Math.min(pagina, totalPaginas);

  const inicio = (paginaActual - 1) * ELEMENTOS_POR_PAGINA;
  const visibles = elementos.slice(inicio, inicio + ELEMENTOS_POR_PAGINA);

  return {
    visibles,
    pagina: paginaActual,
    totalPaginas,
    irA: setPagina,
    desde: elementos.length === 0 ? 0 : inicio + 1,
    hasta: inicio + visibles.length,
    total: elementos.length,
  };
}
