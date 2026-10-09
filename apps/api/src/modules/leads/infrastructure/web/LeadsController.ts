import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  createLeadSchema,
  leadResponseSchema,
  leadsResponseSchema,
  type TLeadResponse,
  type TLeadsResponse,
} from '@repo/schemas';
import { RequirePermissions } from '../../../../shared/decorators/RequirePermissions';
import {
  ZodApiBody,
  ZodApiResponse,
} from '../../../../shared/decorators/zodSwagger';
import { createZodDto } from '../../../../shared/utils/createZodDto';
import type { CreateLeadPort } from '../../application/ports/in/CreateLeadPort';
import type { ListLeadsPort } from '../../application/ports/in/ListLeadsPort';
import { LEADS_TOKENS } from '../../tokens';
import { toLeadResponse, toLeadsResponse } from './LeadPresenter';

class CreateLeadDto extends createZodDto(createLeadSchema) {}

@ApiTags('leads')
@RequirePermissions({ permissions: ['marketing:access'] })
@Controller('leads')
export class LeadsController {
  constructor(
    @Inject(LEADS_TOKENS.ListLeads)
    private readonly listLeads: ListLeadsPort,
    @Inject(LEADS_TOKENS.CreateLead)
    private readonly createLead: CreateLeadPort
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista los leads, los más recientes primero' })
  @ZodApiResponse(HttpStatus.OK, leadsResponseSchema)
  async list(): Promise<TLeadsResponse> {
    return toLeadsResponse(await this.listLeads.execute());
  }

  @Post()
  @ApiOperation({ summary: 'Registra un lead nuevo' })
  @ZodApiBody(createLeadSchema)
  @ZodApiResponse(HttpStatus.CREATED, leadResponseSchema)
  async create(@Body() body: CreateLeadDto): Promise<TLeadResponse> {
    return toLeadResponse(await this.createLead.execute(body));
  }
}
