/**
 * Outbound port: the passage of time.
 *
 * It exists so the use case is deterministic in tests — not to abstract `Date`
 * for its own sake.
 */
export interface Clock {
  now(): Date;
  /** Seconds the process has been alive. */
  uptimeSeconds(): number;
}
