import type { LeadRepositoryPort } from '../../modules/leads/application/ports/out/LeadRepositoryPort';
import type { Lead, LeadData } from '../../modules/leads/domain/Lead';

/** In-memory double to test use cases without a database. */
export class FakeLeadRepository implements LeadRepositoryPort {
  readonly leads: Lead[] = [];

  async findAll(): Promise<Lead[]> {
    return [...this.leads];
  }

  async findByEmail(email: string): Promise<Lead | null> {
    return this.leads.find((lead) => lead.email === email) ?? null;
  }

  async create(data: LeadData): Promise<Lead> {
    const lead: Lead = {
      id: `lead-${this.leads.length + 1}`,
      name: data.name,
      email: data.email,
      source: data.source ?? null,
      createdAt: new Date(),
    };
    this.leads.push(lead);
    return lead;
  }
}
