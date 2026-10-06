/**
 * Stack del error más los de su cadena de `cause`.
 *
 * Drizzle envuelve todo fallo de la base en un `Failed query: …` cuyo stack
 * no dice por qué falló: el motivo real (ENOTFOUND, SSL, relación
 * inexistente, credenciales) viaja en `cause`. Sin esto el log de un 500 de
 * base de datos no sirve para diagnosticarlo.
 */
const MAX_CAUSES = 5;

export function stackWithCauses(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const partes = [error.stack ?? String(error)];
  let actual: unknown = error.cause;
  for (let i = 0; i < MAX_CAUSES && actual !== undefined; i++) {
    const code =
      typeof actual === 'object' && actual !== null && 'code' in actual
        ? ` [${String((actual as { code: unknown }).code)}]`
        : '';
    partes.push(
      actual instanceof Error
        ? `Caused by${code}: ${actual.stack ?? actual.message}`
        : `Caused by: ${String(actual)}`
    );
    actual = actual instanceof Error ? actual.cause : undefined;
  }
  return partes.join('\n');
}
