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
  refreshSesionResponseSchema,
  refreshSesionSchema,
  type TLoginResponse,
  type TRefreshSesionResponse,
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
import type { RefreshSesionPort } from '../../application/ports/in/RefreshSesionPort';
import { SesionInvalidaException } from '../../domain/exceptions/SesionInvalidaException';
import { AUTH_TOKENS } from '../../tokens';
import { toLoginResponse, toRefreshSesionResponse } from './AuthPresenter';

class LoginDto extends createZodDto(loginSchema) {}
class RefreshSesionDto extends createZodDto(refreshSesionSchema) {}

/**
 * Tramo propio del rate limit, más corto que el global: frena el martilleo
 * por IP antes de llegar a Supabase. El conteo de fallos de `login_attempts`
 * es la defensa de fondo; esto es el primer filtro.
 */
const AUTH_THROTTLE = { global: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AUTH_TOKENS.Login) private readonly login: LoginPort,
    @Inject(AUTH_TOKENS.RefreshSesion)
    private readonly refreshSesion: RefreshSesionPort,
    @Inject(AUTH_TOKENS.Logout) private readonly logout: LogoutPort
  ) {}

  @Post('login')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia sesión de staff en el panel' })
  @ZodApiBody(loginSchema)
  @ZodApiResponse(HttpStatus.OK, loginResponseSchema)
  async iniciar(
    @Body() body: LoginDto,
    @Req() request: Request
  ): Promise<TLoginResponse> {
    const result = await this.login.execute({
      ...body,
      ip: request.ip ?? null,
      userAgent: request.get('user-agent') ?? null,
    });
    return toLoginResponse(result);
  }

  @Post('refresh')
  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva el access token con el refresh token' })
  @ZodApiBody(refreshSesionSchema)
  @ZodApiResponse(HttpStatus.OK, refreshSesionResponseSchema)
  async renovar(
    @Body() body: RefreshSesionDto
  ): Promise<TRefreshSesionResponse> {
    return toRefreshSesionResponse(
      await this.refreshSesion.execute(body.refreshToken)
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cierra la sesión del token en Supabase' })
  async cerrar(@Req() request: Request): Promise<void> {
    const token = extractBearerToken(request);
    if (!token) throw new SesionInvalidaException();
    await this.logout.execute(token);
  }
}
