import type { TCrearLead } from '@repo/schemas';
import type { Lead } from '../domain/lead.model';
import type { LeadsApi } from './leads.interfaces';
import { toLeadDomain } from './leads.transform';

export class LeadsServiceClass {
  constructor(private leadsApi: LeadsApi) {}

  async listar(): Promise<Lead[]> {
    const result = await this.leadsApi.listar();
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data.map(toLeadDomain);
  }

  async crear(datos: TCrearLead): Promise<Lead> {
    const result = await this.leadsApi.crear(datos);
    if (!result.success) {
      throw new Error(result.error);
    }
    return toLeadDomain(result.data);
  }
}
