import type { TLead } from '@repo/schemas';
import type { Lead } from '../domain/lead.model';

export function toLeadDomain(dto: TLead): Lead {
  return {
    id: dto.id,
    nombre: dto.nombre,
    correo: dto.correo,
    origen: dto.origen,
    createdAt: new Date(dto.createdAt),
  };
}
