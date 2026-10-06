export const HEALTH_TOKENS = {
  CheckHealth: Symbol('CheckHealthPort'),
  DependencyProbes: Symbol('DependencyProbe[]'),
  Clock: Symbol('Clock'),
} as const;
