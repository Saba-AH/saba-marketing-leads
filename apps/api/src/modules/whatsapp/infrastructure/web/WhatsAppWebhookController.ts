import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  type RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { Public } from '../../../../shared/decorators/Public';
import type { RecibirWebhookPort } from '../../application/ports/in/RecibirWebhookPort';
import type { VerificarSuscripcionWebhookPort } from '../../application/ports/in/VerificarSuscripcionWebhookPort';
import { WHATSAPP_TOKENS } from '../../tokens';

/**
 * Lo llama Meta, no el panel: sin sesión (lo autentica la firma HMAC), sin rate
 * limit (Meta reintenta en ráfagas) y fuera del sobre `{ success, data }`,
 * porque el contrato de las respuestas lo fija Meta.
 */
@ApiExcludeController()
@Controller('whatsapp/webhook')
@Public()
@SkipThrottle()
export class WhatsAppWebhookController {
  constructor(
    @Inject(WHATSAPP_TOKENS.VerificarSuscripcionWebhook)
    private readonly verificarSuscripcion: VerificarSuscripcionWebhookPort,
    @Inject(WHATSAPP_TOKENS.RecibirWebhook)
    private readonly recibirWebhook: RecibirWebhookPort
  ) {}

  @Get()
  verificar(
    @Res({ passthrough: true }) res: Response,
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string
  ): string {
    const respuesta = this.verificarSuscripcion.execute({
      mode,
      verifyToken,
      challenge,
    });
    // Solo en el éxito: un `@Header` también etiquetaría como texto el error JSON.
    res.type('text/plain');
    return respuesta;
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async recibir(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') firma?: string
  ): Promise<void> {
    await this.recibirWebhook.execute({
      rawBody: req.rawBody,
      firma,
      cuerpo: req.body,
    });
  }
}
