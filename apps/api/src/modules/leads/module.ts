import { Module } from '@nestjs/common';
import { CrearLeadUseCase } from './application/use-cases/CrearLeadUseCase';
import { ListarLeadsUseCase } from './application/use-cases/ListarLeadsUseCase';
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
    ListarLeadsUseCase,
    { provide: LEADS_TOKENS.ListarLeads, useExisting: ListarLeadsUseCase },
    CrearLeadUseCase,
    { provide: LEADS_TOKENS.CrearLead, useExisting: CrearLeadUseCase },
  ],
})
export class LeadsModule {}
