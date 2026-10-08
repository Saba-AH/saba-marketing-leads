import { healthResponseSchema, livenessResponseSchema } from '@repo/schemas';
import { describe, expect, it } from 'vitest';
import type { Clock } from '../../modules/health/application/ports/out/Clock';
import type { DependencyProbe } from '../../modules/health/application/ports/out/DependencyProbe';
import { CheckHealthUseCase } from '../../modules/health/application/use-cases/CheckHealthUseCase';
import type { DependencyCheck } from '../../modules/health/domain/HealthReport';
import {
  toHealthResponse,
  toLivenessResponse,
} from '../../modules/health/infrastructure/web/HealthPresenter';

const FIXED_NOW = new Date('2026-08-05T12:00:00.000Z');

const clock: Clock = {
  now: () => FIXED_NOW,
  uptimeSeconds: () => 42.7,
};

function probe(name: string, result: DependencyCheck): DependencyProbe {
  return { name, check: async () => result };
}

function failingProbe(name: string, message: string): DependencyProbe {
  return {
    name,
    check: async () => ({ name, status: 'down', detail: message }),
  };
}

describe('CheckHealthUseCase', () => {
  it('reports ok when every dependency responds', async () => {
    const useCase = new CheckHealthUseCase(
      [probe('postgres', { name: 'postgres', status: 'up', latencyMs: 3 })],
      clock
    );

    const report = await useCase.execute();

    expect(report.status).toBe('ok');
    expect(report.isHealthy).toBe(true);
    expect(report.checks).toHaveLength(1);
  });

  it('reports error if a single dependency is down', async () => {
    const useCase = new CheckHealthUseCase(
      [
        probe('postgres', { name: 'postgres', status: 'up', latencyMs: 3 }),
        failingProbe('storage', 'connection refused'),
      ],
      clock
    );

    const report = await useCase.execute();

    expect(report.status).toBe('error');
    expect(report.checks.map((check) => check.status)).toEqual(['up', 'down']);
  });

  it('truncates the uptime to whole seconds and uses the injected clock', async () => {
    const useCase = new CheckHealthUseCase([], clock);

    const report = await useCase.execute();

    expect(report.uptimeSeconds).toBe(42);
    expect(report.timestamp).toEqual(FIXED_NOW);
  });
});

describe('toHealthResponse', () => {
  it('produces the envelope the client expects and omits empty fields', async () => {
    const useCase = new CheckHealthUseCase(
      [probe('postgres', { name: 'postgres', status: 'up', latencyMs: 3 })],
      clock
    );

    const response = toHealthResponse(await useCase.execute());

    expect(response).toEqual({
      success: true,
      data: {
        status: 'ok',
        uptimeSeconds: 42,
        version: process.env.APP_VERSION ?? '0.0.0',
        environment: process.env.NODE_ENV ?? 'development',
        timestamp: FIXED_NOW.toISOString(),
        checks: [{ name: 'postgres', status: 'up', latencyMs: 3 }],
      },
    });
  });

  it('meets the shared @repo/schemas contract', async () => {
    const useCase = new CheckHealthUseCase(
      [failingProbe('postgres', 'connection refused')],
      clock
    );

    const response = toHealthResponse(await useCase.execute());

    // If the contract changes without the API noticing, this parse fails.
    expect(healthResponseSchema.safeParse(response).success).toBe(true);
  });
});

describe('toLivenessResponse', () => {
  it('always answers ok, without depending on any check', () => {
    const response = toLivenessResponse();

    expect(response).toEqual({ success: true, data: { status: 'ok' } });
    expect(livenessResponseSchema.safeParse(response).success).toBe(true);
  });
});
