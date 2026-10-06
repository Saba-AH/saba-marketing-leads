import type { TDependencyStatus } from '@repo/schemas';

export interface Dependency {
  name: string;
  status: TDependencyStatus;
  latencyMs?: number;
  detail?: string;
}

/**
 * Estado del backend visto desde el panel.
 *
 * Se diferencia del DTO en dos cosas: el instante es un `Date` y no un string,
 * y `isOperational` es una regla del dominio, no un campo que venga en la red.
 */
export interface SystemStatus {
  isOperational: boolean;
  version: string;
  environment: string;
  uptimeSeconds: number;
  checkedAt: Date;
  dependencies: Dependency[];
}
