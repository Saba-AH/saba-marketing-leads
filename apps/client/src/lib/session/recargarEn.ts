/**
 * Navegación con recarga completa: al entrar o salir de una sesión no puede
 * quedar en memoria (React Query, estado de componentes) nada de la anterior.
 */
export function recargarEn(path: string): void {
  window.location.assign(path);
}
