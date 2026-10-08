import { Module } from '@nestjs/common';
import { CreateLeadUseCase } from './application/use-cases/CreateLeadUseCase';
import { ListLeadsUseCase } from './application/use-cases/ListLeadsUseCase';
import { DrizzleLeadRepository } from './infrastructure/persistence/DrizzleLeadRepository';
import { LeadsController } from './infrastructure/web/LeadsController';
import { LEADS_TOKENS } from './tokens';

@Module({
  controllers: [LeadsController],
  providers: [
    DrizzleLeadRepository,
    {
      provide: LEADS_TOKENS.LeadRepository,
      useExisting: DrizzleLeadRepository,
    },
    ListLeadsUseCase,
    { provide: LEADS_TOKENS.ListLeads, useExisting: ListLeadsUseCase },
    CreateLeadUseCase,
    { provide: LEADS_TOKENS.CreateLead, useExisting: CreateLeadUseCase },
  ],
})
export class LeadsModule {}
