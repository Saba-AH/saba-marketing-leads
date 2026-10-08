import type { Lead } from '../../domain/Lead';
import type { leads } from './leads.schema';

type LeadRow = typeof leads.$inferSelect;

export function toLeadDomain(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    source: row.source,
    createdAt: row.createdAt,
  };
}
