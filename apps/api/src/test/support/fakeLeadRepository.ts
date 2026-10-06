import type { LeadRepositoryPort } from '../../modules/leads/application/ports/out/LeadRepositoryPort';
import type { DatosLead, Lead } from '../../modules/leads/domain/Lead';

/** Doble en memoria para probar casos de uso sin base. */
export class FakeLeadRepository implements LeadRepositoryPort {
  readonly leads: Lead[] = [];

  async findAll(): Promise<Lead[]> {
    return [...this.leads];
  }

  async findByCorreo(correo: string): Promise<Lead | null> {
    return this.leads.find((lead) => lead.correo === correo) ?? null;
  }

  async crear(datos: DatosLead): Promise<Lead> {
    const lead: Lead = {
      id: `lead-${this.leads.length + 1}`,
      nombre: datos.nombre,
      correo: datos.correo,
      origen: datos.origen ?? null,
      createdAt: new Date(),
    };
    this.leads.push(lead);
    return lead;
  }
}
