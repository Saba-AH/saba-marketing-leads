import { Inject, Injectable } from '@nestjs/common';
import { LeadCorreoDuplicadoException } from '../../domain/exceptions/LeadCorreoDuplicadoException';
import type { DatosLead, Lead } from '../../domain/Lead';
import { LEADS_TOKENS } from '../../tokens';
import type { CrearLeadPort } from '../ports/in/CrearLeadPort';
import type { LeadRepositoryPort } from '../ports/out/LeadRepositoryPort';

@Injectable()
export class CrearLeadUseCase implements CrearLeadPort {
  constructor(
    @Inject(LEADS_TOKENS.LeadRepository)
    private readonly leads: LeadRepositoryPort
  ) {}

  async execute(datos: DatosLead): Promise<Lead> {
    // Da el error bueno en el caso normal; la carrera entre dos peticiones
    // simultáneas la ataja el índice único en el repositorio.
    if (await this.leads.findByCorreo(datos.correo)) {
      throw new LeadCorreoDuplicadoException();
    }
    return await this.leads.crear(datos);
  }
}
