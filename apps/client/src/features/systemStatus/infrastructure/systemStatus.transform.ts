import type { THealth } from '@repo/schemas';
import type { SystemStatus } from '../domain/systemStatus.model';

export function toSystemStatusDomain(dto: THealth): SystemStatus {
  return {
    isOperational: dto.status === 'ok',
    version: dto.version,
    environment: dto.environment,
    uptimeSeconds: dto.uptimeSeconds,
    checkedAt: new Date(dto.timestamp),
    dependencies: dto.checks.map((check) => ({
      name: check.name,
      status: check.status,
      latencyMs: check.latencyMs,
      detail: check.detail,
    })),
  };
}
