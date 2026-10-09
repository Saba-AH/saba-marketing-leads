/**
 * Stack of the error plus those of its `cause` chain.
 *
 * Drizzle wraps every database failure in a `Failed query: …` whose stack does
 * not say why it failed: the real reason (ENOTFOUND, SSL, missing relation,
 * credentials) travels in `cause`. Without this, the log of a database 500 is
 * useless for diagnosing it.
 */
const MAX_CAUSES = 5;

export function stackWithCauses(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  const parts = [error.stack ?? String(error)];
  let actual: unknown = error.cause;
  for (let i = 0; i < MAX_CAUSES && actual !== undefined; i++) {
    const code =
      typeof actual === 'object' && actual !== null && 'code' in actual
        ? ` [${String((actual as { code: unknown }).code)}]`
        : '';
    parts.push(
      actual instanceof Error
        ? `Caused by${code}: ${actual.stack ?? actual.message}`
        : `Caused by: ${String(actual)}`
    );
    actual = actual instanceof Error ? actual.cause : undefined;
  }
  return parts.join('\n');
}
