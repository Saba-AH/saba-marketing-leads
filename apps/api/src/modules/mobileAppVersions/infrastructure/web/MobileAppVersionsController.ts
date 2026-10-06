import { Controller, Get, HttpStatus, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  listarMobileAppVersionsQuerySchema,
  mobileAppVersionsResponseSchema,
  mobilePlatforms,
  type TMobileAppVersionsResponse,
} from '@repo/schemas';
import { ZodApiResponse } from '../../../../shared/decorators/zodSwagger';
import { createZodDto } from '../../../../shared/utils/createZodDto';
import type { ListarMobileAppVersionsPort } from '../../application/ports/in/ListarMobileAppVersionsPort';
import { MOBILE_APP_VERSIONS_TOKENS } from '../../tokens';
import { toMobileAppVersionsResponse } from './MobileAppVersionPresenter';

class ListarMobileAppVersionsQueryDto extends createZodDto(
  listarMobileAppVersionsQuerySchema
) {}

@ApiTags('mobile-app-versions')
@Controller('mobile-app-versions')
export class MobileAppVersionsController {
  constructor(
    @Inject(MOBILE_APP_VERSIONS_TOKENS.ListarMobileAppVersions)
    private readonly listarVersiones: ListarMobileAppVersionsPort
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista las versiones de la app móvil, las más recientes primero',
  })
  @ApiQuery({ name: 'platform', required: false, enum: mobilePlatforms })
  @ZodApiResponse(HttpStatus.OK, mobileAppVersionsResponseSchema)
  async listar(
    @Query() query: ListarMobileAppVersionsQueryDto
  ): Promise<TMobileAppVersionsResponse> {
    return toMobileAppVersionsResponse(
      await this.listarVersiones.execute(query)
    );
  }
}
