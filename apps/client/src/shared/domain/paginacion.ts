/**
 * Paginación en cliente: la API devuelve la colección entera y cortarla en el
 * servidor es un ticket de backend aparte. Se aplica **después** de buscar y
 * filtrar — sobre la lista cruda, la página 2 mostraría elementos que el
 * filtro excluyó.
 */
export const ELEMENTOS_POR_PAGINA = 10;

/** Cuántos números se muestran antes de recurrir a los puntos suspensivos. */
const MAXIMO_SIN_ELIPSIS = 7;

export type ItemDePaginacion = number | 'elipsis';

export function totalDePaginas(cantidadDeElementos: number): number {
  return Math.max(1, Math.ceil(cantidadDeElementos / ELEMENTOS_POR_PAGINA));
}

/**
 * Los números a dibujar. Siempre la primera, la última y la actual con su
 * vecina de cada lado: así el ancho del control no crece con los datos y la
 * posición relativa se sigue entendiendo.
 */
export function paginasVisibles(
  actual: number,
  total: number
): ItemDePaginacion[] {
  if (total <= MAXIMO_SIN_ELIPSIS) {
    return Array.from({ length: total }, (_, indice) => indice + 1);
  }

  const paginas = new Set<number>([1, total, actual]);
  if (actual - 1 > 1) {
    paginas.add(actual - 1);
  }
  if (actual + 1 < total) {
    paginas.add(actual + 1);
  }

  const ordenadas = [...paginas].sort((a, b) => a - b);
  const items: ItemDePaginacion[] = [];

  for (const [indice, pagina] of ordenadas.entries()) {
    const anterior = ordenadas[indice - 1];
    if (anterior !== undefined && pagina - anterior > 1) {
      items.push('elipsis');
    }
    items.push(pagina);
  }

  return items;
}
