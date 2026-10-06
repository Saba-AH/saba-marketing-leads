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
  it('reporta ok cuando toda dependencia responde', async () => {
    const useCase = new CheckHealthUseCase(
      [probe('postgres', { name: 'postgres', status: 'up', latencyMs: 3 })],
      clock
    );

    const report = await useCase.execute();

    expect(report.status).toBe('ok');
    expect(report.isHealthy).toBe(true);
    expect(report.checks).toHaveLength(1);
  });

  it('reporta error si una sola dependencia está caída', async () => {
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

  it('trunca el uptime a segundos enteros y usa el reloj inyectado', async () => {
    const useCase = new CheckHealthUseCase([], clock);

    const report = await useCase.execute();

    expect(report.uptimeSeconds).toBe(42);
    expect(report.timestamp).toEqual(FIXED_NOW);
  });
});

describe('toHealthResponse', () => {
  it('produce el sobre que el cliente espera y omite los campos vacíos', async () => {
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

  it('cumple el contrato compartido de @repo/schemas', async () => {
    const useCase = new CheckHealthUseCase(
      [failingProbe('postgres', 'connection refused')],
      clock
    );

    const response = toHealthResponse(await useCase.execute());

    // Si el contrato cambia sin que la API se entere, este parse falla.
    expect(healthResponseSchema.safeParse(response).success).toBe(true);
  });
});

describe('toLivenessResponse', () => {
  it('siempre responde ok, sin depender de ninguna comprobación', () => {
    const response = toLivenessResponse();

    expect(response).toEqual({ success: true, data: { status: 'ok' } });
    expect(livenessResponseSchema.safeParse(response).success).toBe(true);
  });
});
