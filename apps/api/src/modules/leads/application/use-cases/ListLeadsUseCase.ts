import { Inject, Injectable } from '@nestjs/common';
import type { Lead } from '../../domain/Lead';
import { LEADS_TOKENS } from '../../tokens';
import type { ListLeadsPort } from '../ports/in/ListLeadsPort';
import type { LeadRepositoryPort } from '../ports/out/LeadRepositoryPort';

@Injectable()
export class ListLeadsUseCase implements ListLeadsPort {
  constructor(
    @Inject(LEADS_TOKENS.LeadRepository)
    private readonly leads: LeadRepositoryPort
  ) {}

  async execute(): Promise<Lead[]> {
    return await this.leads.findAll();
  }
}
