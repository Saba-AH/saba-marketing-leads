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
  crearLeadSchema,
  leadResponseSchema,
  leadsResponseSchema,
  type TLeadResponse,
  type TLeadsResponse,
} from '@repo/schemas';
import {
  ZodApiBody,
  ZodApiResponse,
} from '../../../../shared/decorators/zodSwagger';
import { createZodDto } from '../../../../shared/utils/createZodDto';
import type { CrearLeadPort } from '../../application/ports/in/CrearLeadPort';
import type { ListarLeadsPort } from '../../application/ports/in/ListarLeadsPort';
import { LEADS_TOKENS } from '../../tokens';
import { toLeadResponse, toLeadsResponse } from './LeadPresenter';

class CrearLeadDto extends createZodDto(crearLeadSchema) {}

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(
    @Inject(LEADS_TOKENS.ListarLeads)
    private readonly listarLeads: ListarLeadsPort,
    @Inject(LEADS_TOKENS.CrearLead)
    private readonly crearLead: CrearLeadPort
  ) {}

  @Get()
  @ApiOperation({ summary: 'Lista los leads, los más recientes primero' })
  @ZodApiResponse(HttpStatus.OK, leadsResponseSchema)
  async listar(): Promise<TLeadsResponse> {
    return toLeadsResponse(await this.listarLeads.execute());
  }

  @Post()
  @ApiOperation({ summary: 'Registra un lead nuevo' })
  @ZodApiBody(crearLeadSchema)
  @ZodApiResponse(HttpStatus.CREATED, leadResponseSchema)
  async crear(@Body() body: CrearLeadDto): Promise<TLeadResponse> {
    return toLeadResponse(await this.crearLead.execute(body));
  }
}
