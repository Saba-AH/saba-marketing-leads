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
   * A monitor must not eat rate limit quota, nor get a 200 when a critical
   * dependency is down — hence the 503.
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
   * Liveness: only confirms the process responds, without touching Postgres or
   * Storage — so Cloud Run can restart the instance without a liveness probe
   * depending on an external dependency's health. The deep check with
   * dependencies is `GET /health` (readiness).
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
