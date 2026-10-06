/**
 * Puerto de salida: el paso del tiempo.
 *
 * Existe para que el caso de uso sea determinista en tests — no para abstraer
 * `Date` por gusto.
 */
export interface Clock {
  now(): Date;
  /** Segundos que el proceso lleva vivo. */
  uptimeSeconds(): number;
}
