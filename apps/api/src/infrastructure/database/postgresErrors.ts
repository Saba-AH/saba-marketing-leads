/** `unique_violation` (Postgres, error code table for class 23). */
const UNIQUE_VIOLATION = '23505';

/**
 * A unique index is what really decides: any prior check in the use case lets
 * the race between two simultaneous requests through. Detecting it here lets
 * us translate it into the matching domain exception, so the user reads an
 * explainable 409 instead of a 500.
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === UNIQUE_VIOLATION
  );
}

/**
 * Which index was violated, according to the `constraint` field Postgres
 * attaches to the error.
 *
 * Without this, an operation that can touch several indexes —creating a unit
 * touches the one on its name, its positions and its aliases— can only map
 * every violation to the same error, and two out of three messages point at
 * the wrong field (#136).
 */
export function violatedConstraint(error: unknown): string | undefined {
  if (!isUniqueViolation(error)) {
    return undefined;
  }
  const constraint = (error as { constraint?: unknown }).constraint;
  return typeof constraint === 'string' ? constraint : undefined;
}
