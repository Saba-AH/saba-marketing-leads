/**
 * Clases de los controles de un `.field` del prototipo: borde de 1.5px que se
 * vuelve morado al enfocar, sin el anillo de shadcn.
 *
 * Es una constante y no un componente porque la comparten `input`, `select` y
 * `textarea`, y envolver cada uno en su propio componente solo para repetir
 * esta cadena sería un intermediario sin trabajo propio.
 */
export const CONTROL_CAMPO =
  'w-full rounded-md border-[1.5px] border-gray-200 bg-white px-3 py-2 text-[13px] text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-brand-600 disabled:opacity-50';
