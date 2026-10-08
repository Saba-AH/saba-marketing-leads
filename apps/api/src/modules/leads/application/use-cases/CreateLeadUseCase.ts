import { Inject, Injectable } from '@nestjs/common';
import { LeadDuplicateEmailException } from '../../domain/exceptions/LeadDuplicateEmailException';
import type { Lead, LeadData } from '../../domain/Lead';
import { LEADS_TOKENS } from '../../tokens';
import type { CreateLeadPort } from '../ports/in/CreateLeadPort';
import type { LeadRepositoryPort } from '../ports/out/LeadRepositoryPort';

@Injectable()
export class CreateLeadUseCase implements CreateLeadPort {
  constructor(
    @Inject(LEADS_TOKENS.LeadRepository)
    private readonly leads: LeadRepositoryPort
  ) {}

  async execute(data: LeadData): Promise<Lead> {
    // Gives the right error in the normal case; the race between two simultaneous
    // requests is caught by the unique index in the repository.
    if (await this.leads.findByEmail(data.email)) {
      throw new LeadDuplicateEmailException();
    }
    return await this.leads.create(data);
  }
}
