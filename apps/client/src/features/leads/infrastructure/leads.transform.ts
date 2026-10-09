import type { TLead } from '@repo/schemas';
import type { Lead } from '../domain/lead.model';

export function toLeadDomain(dto: TLead): Lead {
  return {
    id: dto.id,
    name: dto.name,
    email: dto.email,
    source: dto.source,
    createdAt: new Date(dto.createdAt),
  };
}
