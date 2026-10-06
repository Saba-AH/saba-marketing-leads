import { Inject, Injectable } from '@nestjs/common';
import type { Lead } from '../../domain/Lead';
import { LEADS_TOKENS } from '../../tokens';
import type { ListarLeadsPort } from '../ports/in/ListarLeadsPort';
import type { LeadRepositoryPort } from '../ports/out/LeadRepositoryPort';

@Injectable()
export class ListarLeadsUseCase implements ListarLeadsPort {
  constructor(
    @Inject(LEADS_TOKENS.LeadRepository)
    private readonly leads: LeadRepositoryPort
  ) {}

  async execute(): Promise<Lead[]> {
    return await this.leads.findAll();
  }
}
