import type { THealthResponse, TLivenessResponse } from '@repo/schemas';
import type { HealthReport } from '../../domain/HealthReport';

/**
 * Translates the domain report into the contract shared with the client
 * (`@repo/schemas`). The domain does not know the shape of the HTTP envelope.
 */
export function toHealthResponse(report: HealthReport): THealthResponse {
  return {
    success: true,
    data: {
      status: report.status,
      uptimeSeconds: report.uptimeSeconds,
      version: report.version,
      environment: report.environment,
      timestamp: report.timestamp.toISOString(),
      checks: report.checks.map((check) => ({
        name: check.name,
        status: check.status,
        ...(check.latencyMs === undefined
          ? {}
          : { latencyMs: check.latencyMs }),
        ...(check.detail === undefined ? {} : { detail: check.detail }),
      })),
    },
  };
}

/** Liveness: the process responds, without depending on any check. */
export function toLivenessResponse(): TLivenessResponse {
  return { success: true, data: { status: 'ok' } };
}
