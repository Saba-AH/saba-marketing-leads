/**
 * Navigation with a full reload: when entering or leaving a session nothing
 * from the previous one may stay in memory (React Query, component state).
 */
export function reloadIn(path: string): void {
  window.location.assign(path);
}
