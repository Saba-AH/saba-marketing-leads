import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { meResponseSchema, type TMeResponse } from '@repo/schemas';
import { ZodApiResponse } from '../../../../shared/decorators/zodSwagger';
import type { AuthenticatedUser } from '../../domain/AuthSession';
import { toMeResponse } from './AuthPresenter';
import { CurrentUser } from './CurrentUser';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  /** No extra call to Saba: the guard already loaded the user when validating the session. */
  @Get()
  @ApiOperation({ summary: 'Usuario de la sesión actual' })
  @ZodApiResponse(HttpStatus.OK, meResponseSchema)
  me(@CurrentUser() user: AuthenticatedUser): TMeResponse {
    return toMeResponse(user);
  }
}
