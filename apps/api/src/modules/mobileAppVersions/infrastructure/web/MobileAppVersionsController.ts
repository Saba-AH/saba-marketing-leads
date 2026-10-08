import { Controller, Get, HttpStatus, Inject, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  listMobileAppVersionsQuerySchema,
  mobileAppVersionsResponseSchema,
  mobilePlatforms,
  type TMobileAppVersionsResponse,
} from '@repo/schemas';
import { Public } from '../../../../shared/decorators/Public';
import { ZodApiResponse } from '../../../../shared/decorators/zodSwagger';
import { createZodDto } from '../../../../shared/utils/createZodDto';
import type { ListMobileAppVersionsPort } from '../../application/ports/in/ListMobileAppVersionsPort';
import { MOBILE_APP_VERSIONS_TOKENS } from '../../tokens';
import { toMobileAppVersionsResponse } from './MobileAppVersionPresenter';

class ListMobileAppVersionsQueryDto extends createZodDto(
  listMobileAppVersionsQuerySchema
) {}

// The mobile app checks it before logging in, to force an update.
@ApiTags('mobile-app-versions')
@Controller('mobile-app-versions')
@Public()
export class MobileAppVersionsController {
  constructor(
    @Inject(MOBILE_APP_VERSIONS_TOKENS.ListMobileAppVersions)
    private readonly listVersions: ListMobileAppVersionsPort
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lista las versiones de la app móvil, las más recientes primero',
  })
  @ApiQuery({ name: 'platform', required: false, enum: mobilePlatforms })
  @ZodApiResponse(HttpStatus.OK, mobileAppVersionsResponseSchema)
  async list(
    @Query() query: ListMobileAppVersionsQueryDto
  ): Promise<TMobileAppVersionsResponse> {
    return toMobileAppVersionsResponse(await this.listVersions.execute(query));
  }
}
