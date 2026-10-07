export interface SolicitudSaba {
  id: string;
  estado: string;
  activa: boolean;
  creadaAt: Date;
}

export interface ClienteSaba {
  id: string;
  nombre: string;
  telefono: string | null;
  cedula: string | null;
  /** La activa más reciente o, si no hay activas, la más reciente. */
  solicitudReciente: SolicitudSaba | null;
}

export interface ResumenClienteSaba extends ClienteSaba {
  solicitudes: SolicitudSaba[];
}

/** Los mismos que `ACTIVE_APP_STATUSES` de Saba (`src/pages/admin/users/AdminUsers.tsx`). */
export const ESTADOS_SOLICITUD_ACTIVA = [
  'approved',
  'pending',
  'date_scheduled',
] as const;

export function esSolicitudActiva(estado: string): boolean {
  return (ESTADOS_SOLICITUD_ACTIVA as readonly string[]).includes(estado);
}

/**
 * Formas en que Saba puede tener guardado un teléfono, en solo dígitos. Los
 * perfiles mezclan `+58 414…`, `0414…` y `414…` (ver `normalizePhoneE164` en
 * `saba/services/arizon/arizonReceivables.js`).
 */
export function variantesTelefono(waId: string): string[] {
  const digitos = waId.replace(/\D/g, '');
  if (/^58\d{10}$/.test(digitos)) {
    const local = digitos.slice(2);
    return [digitos, `0${local}`, local];
  }
  return digitos ? [digitos] : [];
}

/**
 * Mejor candidato primero: con solicitud activa, luego por la solicitud más
 * reciente, y al final los que no tienen solicitudes.
 */
export function ordenarCandidatos(clientes: ClienteSaba[]): ClienteSaba[] {
  const rango = (c: ClienteSaba): number =>
    c.solicitudReciente ? (c.solicitudReciente.activa ? 0 : 1) : 2;
  return [...clientes].sort(
    (a, b) =>
      rango(a) - rango(b) ||
      (b.solicitudReciente?.creadaAt.getTime() ?? 0) -
        (a.solicitudReciente?.creadaAt.getTime() ?? 0)
  );
}
