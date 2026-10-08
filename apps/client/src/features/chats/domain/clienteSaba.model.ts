import { formatearTelefono } from './chat.model';

export interface SolicitudSaba {
  id: string;
  estado: string;
  estadoEtiqueta: string;
  activa: boolean;
  creadaAt: Date;
  producto: string | null;
  montoFinanciado: number | null;
  cuota: number | null;
  frecuencia: string | null;
}

export interface ClienteSaba {
  id: string;
  nombre: string;
  cedula: string | null;
  correo: string | null;
  telefono: string | null;
  ciudad: string | null;
  origen: string | null;
  clienteDesde: Date | null;
  solicitudes: SolicitudSaba[];
}

export interface ClienteSabaDelChat {
  sinTelefono: boolean;
  /** El más probable primero. */
  clientes: ClienteSaba[];
}

export type TonoSolicitud = 'activa' | 'rechazada' | 'cerrada' | 'en_proceso';

export function tonoSolicitud(solicitud: SolicitudSaba): TonoSolicitud {
  if (solicitud.activa) return 'activa';
  if (solicitud.estado === 'rejected') return 'rechazada';
  if (solicitud.estado === 'completed') return 'cerrada';
  return 'en_proceso';
}

const FRECUENCIAS: Record<string, string> = {
  weekly: 'semanal',
  biweekly: 'quincenal',
  monthly: 'mensual',
};

const dolares = new Intl.NumberFormat('es-VE', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 2,
});

export function formatearMonto(monto: number | null): string | null {
  return monto === null ? null : dolares.format(monto);
}

/** "$40,00 semanal"; `null` si Saba no tiene la cuota. */
export function formatearCuota(solicitud: SolicitudSaba): string | null {
  const monto = formatearMonto(solicitud.cuota);
  if (!monto) return null;
  const frecuencia = solicitud.frecuencia
    ? (FRECUENCIAS[solicitud.frecuencia] ?? solicitud.frecuencia)
    : null;
  return frecuencia ? `${monto} ${frecuencia}` : monto;
}

export function formatearFecha(fecha: Date): string {
  return fecha.toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** "2026-09-18" → "sept. de 2026": para "Cliente desde". */
export function formatearMesAnio(fecha: Date): string {
  return fecha.toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    month: 'short',
    year: 'numeric',
  });
}

/** Saba guarda `+58…`, `0414…` o `414…`: se muestra siempre como `+58 414 123 4567`. */
export function formatearTelefonoSaba(telefono: string): string {
  const digitos = telefono.replace(/\D/g, '');
  if (/^0\d{10}$/.test(digitos))
    return formatearTelefono(`58${digitos.slice(1)}`);
  if (/^4\d{9}$/.test(digitos)) return formatearTelefono(`58${digitos}`);
  return digitos ? formatearTelefono(digitos) : telefono;
}
