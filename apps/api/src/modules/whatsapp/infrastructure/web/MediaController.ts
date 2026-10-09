import { Readable } from 'node:stream';
import type { ReadableStream as NodeWebReadableStream } from 'node:stream/web';
import {
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { RequirePermissions } from '../../../../shared/decorators/RequirePermissions';
import type { GetMediaPort } from '../../application/ports/in/GetMediaPort';
import { isInlineDisplayable } from '../../domain/Chats';
import { WHATSAPP_TOKENS } from '../../tokens';

@ApiTags('whatsapp')
@RequirePermissions({ permissions: ['marketing:access'] })
@Controller('whatsapp/messages')
export class MediaController {
  constructor(
    @Inject(WHATSAPP_TOKENS.GetMedia)
    private readonly getMedia: GetMediaPort
  ) {}

  @Get(':id/media')
  @ApiOperation({
    summary: 'Archivo de un mensaje (imagen, audio, video o documento)',
    description:
      'Se pide a Meta en el momento; Meta lo conserva unos 30 días. Responde el binario, no el sobre JSON.',
  })
  async media(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response
  ): Promise<void> {
    const file = await this.getMedia.execute(id);
    res.status(200);
    res.setHeader('Content-Type', file.mimeType);
    if (file.size !== null) {
      res.setHeader('Content-Length', String(file.size));
    }
    // A message never changes its file; `private` because it belongs to a customer.
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    res.setHeader(
      'Content-Disposition',
      isInlineDisplayable(file.mimeType) ? 'inline' : 'attachment'
    );
    Readable.fromWeb(file.content as NodeWebReadableStream<Uint8Array>).pipe(
      res
    );
  }
}
