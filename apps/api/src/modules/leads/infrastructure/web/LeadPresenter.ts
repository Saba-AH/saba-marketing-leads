import type { TLead, TLeadResponse, TLeadsResponse } from '@repo/schemas';
import type { Lead } from '../../domain/Lead';

function toLead(lead: Lead): TLead {
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email,
    source: lead.source,
    createdAt: lead.createdAt.toISOString(),
  };
}

export function toLeadResponse(lead: Lead): TLeadResponse {
  return { success: true, data: toLead(lead) };
}

export function toLeadsResponse(leads: Lead[]): TLeadsResponse {
  return { success: true, data: leads.map(toLead) };
}
