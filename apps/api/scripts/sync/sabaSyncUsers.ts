/**
 * Usuarios de Saba que `npm run db:sync:saba` copia de prod al Supabase local,
 * con su cuenta, su perfil y sus solicitudes. Para traer a alguien más, sumar
 * su correo acá.
 *
 * La separación es para validar: el sync avisa si un admin no tiene rol de
 * staff en prod, o si un cliente sí lo tiene.
 */
export const SYNC_USERS = {
  admins: ['angel.hernandez@sabatransporte.com'],
  clientes: ['angel.hernandez+user-test@sabatransporte.com'],
} as const satisfies Record<string, readonly string[]>;

export interface SyncUsers {
  admins: readonly string[];
  clientes: readonly string[];
}
