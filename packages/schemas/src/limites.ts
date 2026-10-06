/**
 * Topes de longitud del contrato.
 *
 * Las columnas son `text` sin límite: sin un tope compartido, un nombre de
 * 50.000 caracteres entraría, descuadraría las tablas y engordaría cada
 * respuesta de listado sin techo.
 *
 * Viven acá y no sueltos en cada schema para que la API y el cliente rechacen
 * lo mismo, y para que subir un tope sea un solo cambio.
 */
export const LIMITES = {
  /** Nombres que se muestran en tablas y menús. */
  nombre: 120,
  /** Etiquetas cortas de catálogo. */
  etiqueta: 80,
  /** El máximo de una dirección de correo real (RFC 5321). */
  correo: 254,
} as const;

/** Mensaje uniforme, para no repetir la misma frase en cada campo. */
export function maximo(campo: string, tope: number): string {
  return `${campo} no puede pasar de ${tope} caracteres.`;
}
