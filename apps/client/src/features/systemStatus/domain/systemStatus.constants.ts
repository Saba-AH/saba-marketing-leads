import type { TDependencyStatus } from '@repo/schemas';

export const DEPENDENCY_STATUS_LABELS: Record<TDependencyStatus, string> = {
  up: 'Operativa',
  down: 'Caída',
  degraded: 'Degradada',
};

export const DEPENDENCY_NAME_LABELS: Record<string, string> = {
  postgres: 'Base de datos',
};

/** Cada cuánto el panel revisa el estado, en milisegundos. */
export const SYSTEM_STATUS_REFETCH_INTERVAL_MS = 30_000;
