/**
 * The contract's length limits.
 *
 * Columns are unbounded `text`: without a shared limit, a 50,000-character name
 * would get in, break the tables' layout and bloat every list response with no
 * ceiling.
 *
 * They live here and not scattered in each schema so the API and the client
 * reject the same things, and so raising a limit is a single change.
 */
export const LENGTH_LIMITS = {
  /** Names shown in tables and menus. */
  name: 120,
  /** Short catalog labels. */
  label: 80,
  /** The maximum of a real email address (RFC 5321). */
  email: 254,
} as const;

/** Uniform message, so the same sentence is not repeated on every field. */
export function maxLengthMessage(field: string, limit: number): string {
  return `${field} no puede pasar de ${limit} caracteres.`;
}
