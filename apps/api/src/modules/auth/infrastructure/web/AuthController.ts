import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  loginResponseSchema,
  loginSchema,
  refreshSessionResponseSchema,
  refreshSessionSchema,
  type TLoginResponse,
  type TRefreshSessionResponse,
} from '@repo/schemas';
import type { Request } from 'express';
import { Public } from '../../../../shared/decorators/Public';
import {
  ZodApiBody,
  ZodApiResponse,
} from '../../../../shared/decorators/zodSwagger';
import { extractBearerToken } from '../../../../shared/http/extractBearerToken';
import { createZodDto } from '../../../../shared/utils/createZodDto';
import type { LoginPort } from '../../application/ports/in/LoginPort';
import type { LogoutPort } from '../../application/ports/in/LogoutPort';
import type { RefreshSessionPort } from '../../application/ports/in/RefreshSessionPort';
import { InvalidSessionException } from '../../domain/exceptions/InvalidSessionException';
import { AUTH_TOKENS } from '../../tokens';
import { toLoginResponse, toRefreshSessionResponse } from './AuthPresenter';

class LoginDto extends createZodDto(loginSchema) {}
class RefreshSessionDto extends createZodDto(refreshSessionSchema) {}

/**
 * Its own rate limit tier, shorter than the global one: stops per-IP hammering
 * before it reaches Saba. Saba's `login_attempts` failure count is the real
 * defense; this is the first filter.
 */
const AUTH_THROTTLE = { global: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_TOKENS.Login) private readonly login: LoginPort,
    @Inject(AUTH_TOKENS.RefreshSession)
    private readonly refreshSession: RefreshSessionPort,
    @Inject(AUTH_TOKENS.Logout) private readonly logout: LogoutPort
  ) {}

  @Post('login')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión de staff en el panel' })
  @ZodApiBody(loginSchema)
  @ZodApiResponse(HttpStatus.OK, loginResponseSchema)
  async start(
    @Body() body: LoginDto,
    @Req() request: Request
  ): Promise<TLoginResponse> {
    const result = await this.login.execute({
      ...body,
      client: {
        ip: request.ip ?? null,
        userAgent: request.get('user-agent') ?? null,
      },
    });
    return toLoginResponse(result);
  }

  @Post('refresh')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva el access token con el refresh token' })
  @ZodApiBody(refreshSessionSchema)
  @ZodApiResponse(HttpStatus.OK, refreshSessionResponseSchema)
  async renew(
    @Body() body: RefreshSessionDto
  ): Promise<TRefreshSessionResponse> {
    return toRefreshSessionResponse(
      await this.refreshSession.execute(body.refreshToken)
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cierra la sesión del token en Saba' })
  async close(@Req() request: Request): Promise<void> {
    const token = extractBearerToken(request);
    if (!token) throw new InvalidSessionException();
    await this.logout.execute(token);
  }
}
