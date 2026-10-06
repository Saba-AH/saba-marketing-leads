import { Controller, Get, HttpStatus, Inject, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  healthResponseSchema,
  livenessResponseSchema,
  type THealthResponse,
  type TLivenessResponse,
} from '@repo/schemas';
import type { Response } from 'express';
import { Public } from '../../../../shared/decorators/Public';
import { ZodApiResponse } from '../../../../shared/decorators/zodSwagger';
import type { CheckHealthPort } from '../../application/ports/in/CheckHealthPort';
import { HEALTH_TOKENS } from '../../tokens';
import { toHealthResponse, toLivenessResponse } from './HealthPresenter';

@ApiTags('health')
@Controller('health')
@Public()
export class HealthController {
  constructor(
    @Inject(HEALTH_TOKENS.CheckHealth)
    private readonly checkHealth: CheckHealthPort
  ) {}

  /**
   * Un monitor no debe consumir cuota del rate limit, y tampoco debe recibir
   * 200 cuando una dependencia crítica está caída — de ahí el 503.
   */
  @Get()
  @SkipThrottle()
  @ApiOperation({
    summary: 'Estado de la API y de sus dependencias',
    description:
      'Responde 200 si todo está arriba y 503 si alguna dependencia crítica falla. ' +
      'El cuerpo detalla cada dependencia por separado.',
  })
  @ZodApiResponse(HttpStatus.OK, healthResponseSchema, 'API sana')
  @ZodApiResponse(
    HttpStatus.SERVICE_UNAVAILABLE,
    healthResponseSchema,
    'Alguna dependencia crítica está caída'
  )
  async check(
    @Res({ passthrough: true }) res: Response
  ): Promise<THealthResponse> {
    const report = await this.checkHealth.execute();

    res.status(
      report.isHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE
    );

    return toHealthResponse(report);
  }

  /**
   * Liveness: solo confirma que el proceso responde, sin tocar Postgres ni
   * Storage — así Cloud Run puede reiniciar la instancia sin que un liveness
   * probe dependa de la salud de una dependencia externa. El deep check con
   * dependencias es `GET /health` (readiness).
   */
  @Get('live')
  @SkipThrottle()
  @ApiOperation({
    summary: 'El proceso responde (liveness), sin comprobar dependencias',
  })
  @ZodApiResponse(HttpStatus.OK, livenessResponseSchema)
  live(): TLivenessResponse {
    return toLivenessResponse();
  }
}
