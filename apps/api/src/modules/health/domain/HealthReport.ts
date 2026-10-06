import type { TDependencyStatus } from '@repo/schemas';

/** Resultado de comprobar una dependencia de la API. */
export interface DependencyCheck {
  name: string;
  status: TDependencyStatus;
  latencyMs?: number;
  /**
   * Motivo cuando el estado no es `up`. Es texto para operadores: nunca debe
   * llevar credenciales, tokens ni URLs firmadas (ver E00·10).
   */
  detail?: string;
}

/**
 * Reporte de salud de la API.
 *
 * Regla: el reporte está `ok` solo si **toda** dependencia crítica responde.
 * Una dependencia no crítica en `down` degrada el reporte pero no lo tumba.
 */
export class HealthReport {
  private constructor(
    public readonly checks: readonly DependencyCheck[],
    public readonly uptimeSeconds: number,
    public readonly version: string,
    public readonly environment: string,
    public readonly timestamp: Date
  ) {}

  static from(params: {
    checks: readonly DependencyCheck[];
    uptimeSeconds: number;
    version: string;
    environment: string;
    now: Date;
  }): HealthReport {
    return new HealthReport(
      params.checks,
      params.uptimeSeconds,
      params.version,
      params.environment,
      params.now
    );
  }

  get status(): 'ok' | 'error' {
    return this.checks.every((check) => check.status === 'up') ? 'ok' : 'error';
  }

  get isHealthy(): boolean {
    return this.status === 'ok';
  }
}
