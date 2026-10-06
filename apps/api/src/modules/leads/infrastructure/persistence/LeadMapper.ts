import type { Lead } from '../../domain/Lead';
import type { leads } from './leads.schema';

type LeadRow = typeof leads.$inferSelect;

export function toLeadDomain(row: LeadRow): Lead {
  return {
    id: row.id,
    nombre: row.nombre,
    correo: row.correo,
    origen: row.origen,
    createdAt: row.createdAt,
  };
}
