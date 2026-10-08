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
import type { ReceiveWebhookPort } from '../../application/ports/in/ReceiveWebhookPort';
import type { VerifyWebhookSubscriptionPort } from '../../application/ports/in/VerifyWebhookSubscriptionPort';
import { WHATSAPP_TOKENS } from '../../tokens';

/**
 * Called by Meta, not by the panel: no session (the HMAC signature
 * authenticates it), no rate limit (Meta retries in bursts) and outside the
 * `{ success, data }` envelope, because Meta sets the response contract.
 */
@ApiExcludeController()
@Controller('whatsapp/webhook')
@Public()
@SkipThrottle()
export class WhatsAppWebhookController {
  constructor(
    @Inject(WHATSAPP_TOKENS.VerifyWebhookSubscription)
    private readonly verifySubscription: VerifyWebhookSubscriptionPort,
    @Inject(WHATSAPP_TOKENS.ReceiveWebhook)
    private readonly receiveWebhook: ReceiveWebhookPort
  ) {}

  @Get()
  verify(
    @Res({ passthrough: true }) res: Response,
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string
  ): string {
    const response = this.verifySubscription.execute({
      mode,
      verifyToken,
      challenge,
    });
    // Only on success: a `@Header` would also label the JSON error as text.
    res.type('text/plain');
    return response;
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-hub-signature-256') signature?: string
  ): Promise<void> {
    await this.receiveWebhook.execute({
      rawBody: req.rawBody,
      signature,
      body: req.body,
    });
  }
}
