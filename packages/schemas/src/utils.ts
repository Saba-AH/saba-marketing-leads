import { z } from 'zod';
import { SomeType } from 'zod/v4/core';

export function buildSafeResponseSchema<T extends SomeType>(schema: T) {
  const safeSchema = z.discriminatedUnion('success', [
    z.object({
      success: z.literal(false),
      error: z.string(),
      // Optional: added by `HttpExceptionFilter`/`DomainExceptionFilter` (E00·10).
      // Optional so fixtures from before the global filter do not break.
      code: z.string().optional(),
      correlationId: z.string().optional(),
      timestamp: z.string().optional(),
      path: z.string().optional(),
    }),
    z.object({
      success: z.literal(true),
      data: schema,
    }),
  ]);
  return safeSchema;
}

export const zDateToIsoNullableOpt = z
  .union([z.date(), z.string(), z.null(), z.undefined()])
  .transform((v) => (v instanceof Date ? v.toISOString() : v));
