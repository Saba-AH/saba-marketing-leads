/** `unique_violation` (Postgres, tabla de códigos de error de la clase 23). */
const UNIQUE_VIOLATION = '23505';

/**
 * Un índice único es quien decide de verdad: cualquier chequeo previo en el
 * caso de uso deja pasar la carrera entre dos peticiones simultáneas.
 * Detectarlo acá permite traducirlo a la excepción de dominio que
 * corresponda, y que el usuario lea un 409 explicable en vez de un 500.
 */
export function esViolacionDeUnicidad(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

/**
 * Qué índice se violó, según el campo `constraint` que Postgres adjunta al
 * error.
 *
 * Sin esto, una operación que puede tocar varios índices —crear una unidad
 * toca el de su nombre, el de sus posiciones y el de sus aliases— solo puede
 * traducir todas las violaciones al mismo error, y dos de cada tres mensajes
 * apuntan al campo equivocado (#136).
 */
export function constraintViolado(error: unknown): string | undefined {
  if (!esViolacionDeUnicidad(error)) {
    return undefined;
  }
  const constraint = (error as { constraint?: unknown }).constraint;
  return typeof constraint === 'string' ? constraint : undefined;
}
