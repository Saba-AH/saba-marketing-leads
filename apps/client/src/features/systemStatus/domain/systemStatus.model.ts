import type { TDependencyStatus } from '@repo/schemas';

export interface Dependency {
  name: string;
  status: TDependencyStatus;
  latencyMs?: number;
  detail?: string;
}

/**
 * Backend status as seen from the panel.
 *
 * It differs from the DTO in two ways: the instant is a `Date` and not a
 * string, and `isOperational` is a domain rule, not a field coming over the
 * wire.
 */
export interface SystemStatus {
  isOperational: boolean;
  version: string;
  environment: string;
  uptimeSeconds: number;
  checkedAt: Date;
  dependencies: Dependency[];
}
