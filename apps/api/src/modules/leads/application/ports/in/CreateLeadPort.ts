import type { Lead, LeadData } from '../../../domain/Lead';

export interface CreateLeadPort {
  execute(data: LeadData): Promise<Lead>;
}
