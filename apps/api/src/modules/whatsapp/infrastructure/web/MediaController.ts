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
import type { ObtenerMediaPort } from '../../application/ports/in/ObtenerMediaPort';
import { seMuestraEnLinea } from '../../domain/Chats';
import { WHATSAPP_TOKENS } from '../../tokens';

@ApiTags('whatsapp')
@Controller('whatsapp/mensajes')
export class MediaController {
  constructor(
    @Inject(WHATSAPP_TOKENS.ObtenerMedia)
    private readonly obtenerMedia: ObtenerMediaPort
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
    const archivo = await this.obtenerMedia.execute(id);
    res.status(200);
    res.setHeader('Content-Type', archivo.mimeType);
    if (archivo.tamano !== null) {
      res.setHeader('Content-Length', String(archivo.tamano));
    }
    // Un mensaje nunca cambia su archivo; `private` porque es de un cliente.
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    res.setHeader(
      'Content-Disposition',
      seMuestraEnLinea(archivo.mimeType) ? 'inline' : 'attachment'
    );
    Readable.fromWeb(
      archivo.contenido as NodeWebReadableStream<Uint8Array>
    ).pipe(res);
  }
}
