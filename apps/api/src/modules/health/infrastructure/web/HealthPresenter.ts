import type { THealthResponse, TLivenessResponse } from '@repo/schemas';
import type { HealthReport } from '../../domain/HealthReport';

/**
 * Traduce el reporte de dominio al contrato compartido con el cliente
 * (`@repo/schemas`). El dominio no conoce la forma del sobre HTTP.
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

/** Liveness: el proceso responde, sin depender de ninguna comprobación. */
export function toLivenessResponse(): TLivenessResponse {
  return { success: true, data: { status: 'ok' } };
}
