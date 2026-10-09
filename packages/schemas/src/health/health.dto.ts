import { z } from 'zod';
import { buildSafeResponseSchema } from '../utils';

/**
 * Status of a dependency the API needs to operate.
 * `degraded` exists for non-critical dependencies: the API responds, but something is not healthy.
 */
export const dependencyStatuses = ['up', 'down', 'degraded'] as const;
export const dependencyStatusSchema = z.enum(dependencyStatuses);
export type TDependencyStatus = z.infer<typeof dependencyStatusSchema>;

export const dependencyCheckSchema = z.object({
  name: z.string(),
  status: dependencyStatusSchema,
  /** Milliseconds the check took. Absent if it could not be measured. */
  latencyMs: z.number().nonnegative().optional(),
  /** Reason when the status is not `up`. Never includes credentials or signed URLs. */
  detail: z.string().optional(),
});
export type TDependencyCheck = z.infer<typeof dependencyCheckSchema>;

export const healthSchema = z.object({
  /** `ok` if every critical dependency is up. */
  status: z.enum(['ok', 'error']),
  /** Seconds the process has been alive. */
  uptimeSeconds: z.number().nonnegative(),
  version: z.string(),
  environment: z.string(),
  timestamp: z.string(),
  checks: z.array(dependencyCheckSchema),
});
export type THealth = z.infer<typeof healthSchema>;

/** Response of `GET /api/v1/health` (readiness: probes each dependency) — the API's `{ success, data }` envelope. */
export const healthResponseSchema = buildSafeResponseSchema(healthSchema);
export type THealthResponse = z.infer<typeof healthResponseSchema>;

/** `GET /api/v1/health/live` (liveness): the process responds, without touching dependencies. */
export const livenessSchema = z.object({
  status: z.literal('ok'),
});
export type TLiveness = z.infer<typeof livenessSchema>;

export const livenessResponseSchema = buildSafeResponseSchema(livenessSchema);
export type TLivenessResponse = z.infer<typeof livenessResponseSchema>;
