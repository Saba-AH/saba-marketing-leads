import type { TDependencyStatus } from '@repo/schemas';

/** Result of checking one of the API's dependencies. */
export interface DependencyCheck {
  name: string;
  status: TDependencyStatus;
  latencyMs?: number;
  /**
   * Reason when the status is not `up`. It is text for operators: it must never
   * carry credentials, tokens or signed URLs (see E00·10).
   */
  detail?: string;
}

/**
 * API health report.
 *
 * Rule: the report is `ok` only if **every** critical dependency responds. A
 * non-critical dependency that is `down` degrades the report but does not
 * bring it down.
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
