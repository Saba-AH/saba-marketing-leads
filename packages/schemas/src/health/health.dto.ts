import { z } from 'zod';
import { buildSafeResponseSchema } from '../utils';

/**
 * Estado de una dependencia que la API necesita para operar.
 * `degraded` existe para dependencias no críticas: la API responde, pero algo no está sano.
 */
export const dependencyStatuses = ['up', 'down', 'degraded'] as const;
export const dependencyStatusSchema = z.enum(dependencyStatuses);
export type TDependencyStatus = z.infer<typeof dependencyStatusSchema>;

export const dependencyCheckSchema = z.object({
  name: z.string(),
  status: dependencyStatusSchema,
  /** Milisegundos que tardó la comprobación. Ausente si no se pudo medir. */
  latencyMs: z.number().nonnegative().optional(),
  /** Motivo cuando el estado no es `up`. Nunca incluye credenciales ni URLs firmadas. */
  detail: z.string().optional(),
});
export type TDependencyCheck = z.infer<typeof dependencyCheckSchema>;

export const healthSchema = z.object({
  /** `ok` si toda dependencia crítica está arriba. */
  status: z.enum(['ok', 'error']),
  /** Segundos que el proceso lleva vivo. */
  uptimeSeconds: z.number().nonnegative(),
  version: z.string(),
  environment: z.string(),
  timestamp: z.string(),
  checks: z.array(dependencyCheckSchema),
});
export type THealth = z.infer<typeof healthSchema>;

/** Respuesta de `GET /api/v1/health` (readiness: prueba cada dependencia) — el sobre `{ success, data }` de la API. */
export const healthResponseSchema = buildSafeResponseSchema(healthSchema);
export type THealthResponse = z.infer<typeof healthResponseSchema>;

/** `GET /api/v1/health/live` (liveness): el proceso responde, sin tocar dependencias. */
export const livenessSchema = z.object({
  status: z.literal('ok'),
});
export type TLiveness = z.infer<typeof livenessSchema>;

export const livenessResponseSchema = buildSafeResponseSchema(livenessSchema);
export type TLivenessResponse = z.infer<typeof livenessResponseSchema>;
