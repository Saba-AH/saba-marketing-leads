import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  clienteSabaChatResponseSchema,
  conversacionesResponseSchema,
  enviarMensajeSchema,
  mensajeResponseSchema,
  mensajesResponseSchema,
  sinDatosResponseSchema,
  type TClienteSabaChatResponse,
  type TConversacionesResponse,
  type TMensajeResponse,
  type TMensajesResponse,
  type TSinDatosResponse,
} from '@repo/schemas';
import type { Request } from 'express';
import {
  ZodApiBody,
  ZodApiResponse,
} from '../../../../shared/decorators/zodSwagger';
import { extractBearerToken } from '../../../../shared/http/extractBearerToken';
import { createZodDto } from '../../../../shared/utils/createZodDto';
import type { AuthenticatedUser } from '../../../auth/domain/AuthSession';
import { SesionInvalidaException } from '../../../auth/domain/exceptions/SesionInvalidaException';
import { CurrentUser } from '../../../auth/infrastructure/web/CurrentUser';
import type { IndicarEscribiendoPort } from '../../application/ports/in/IndicarEscribiendoPort';
import type { ListarConversacionesPort } from '../../application/ports/in/ListarConversacionesPort';
import type { ListarMensajesPort } from '../../application/ports/in/ListarMensajesPort';
import type { MarcarLeidaPort } from '../../application/ports/in/MarcarLeidaPort';
import type { ObtenerClienteSabaPort } from '../../application/ports/in/ObtenerClienteSabaPort';
import type { ResponderConversacionPort } from '../../application/ports/in/ResponderConversacionPort';
import { WHATSAPP_TOKENS } from '../../tokens';
import {
  toClienteSabaChatResponse,
  toConversacionesResponse,
  toMensajeResponse,
  toMensajesResponse,
} from './ChatsPresenter';

class EnviarMensajeDto extends createZodDto(enviarMensajeSchema) {}

// Por ahora basta con tener acceso al panel (AuthGuard); los permisos finos
// (`whatsapp_chats.*`) están pendientes en el plan.
@ApiTags('whatsapp')
@Controller('whatsapp/conversaciones')
export class ChatsController {
  constructor(
    @Inject(WHATSAPP_TOKENS.ListarConversaciones)
    private readonly listarConversaciones: ListarConversacionesPort,
    @Inject(WHATSAPP_TOKENS.ListarMensajes)
    private readonly listarMensajes: ListarMensajesPort,
    @Inject(WHATSAPP_TOKENS.ResponderConversacion)
    private readonly responder: ResponderConversacionPort,
    @Inject(WHATSAPP_TOKENS.MarcarLeida)
    private readonly marcarLeida: MarcarLeidaPort,
    @Inject(WHATSAPP_TOKENS.IndicarEscribiendo)
    private readonly indicarEscribiendo: IndicarEscribiendoPort,
    @Inject(WHATSAPP_TOKENS.ObtenerClienteSaba)
    private readonly obtenerClienteSaba: ObtenerClienteSabaPort
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Conversaciones, la de actividad más reciente primero',
  })
  @ZodApiResponse(HttpStatus.OK, conversacionesResponseSchema)
  async listar(): Promise<TConversacionesResponse> {
    return toConversacionesResponse(await this.listarConversaciones.execute());
  }

  @Get(':id/mensajes')
  @ApiOperation({
    summary: 'Mensajes de una conversación, en orden cronológico',
  })
  @ZodApiResponse(HttpStatus.OK, mensajesResponseSchema)
  async mensajes(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<TMensajesResponse> {
    return toMensajesResponse(await this.listarMensajes.execute(id));
  }

  @Post(':id/mensajes')
  @ApiOperation({
    summary: 'Responde con texto libre (solo con la ventana de 24 h abierta)',
  })
  @ZodApiBody(enviarMensajeSchema)
  @ZodApiResponse(HttpStatus.CREATED, mensajeResponseSchema)
  async enviar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: EnviarMensajeDto,
    @CurrentUser() usuario: AuthenticatedUser
  ): Promise<TMensajeResponse> {
    return toMensajeResponse(
      await this.responder.execute({
        conversationId: id,
        cuerpo: body.cuerpo,
        enviadoPor: usuario.id,
      })
    );
  }

  @Post(':id/leida')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca la conversación como leída' })
  @ZodApiResponse(HttpStatus.OK, sinDatosResponseSchema)
  async leida(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<TSinDatosResponse> {
    await this.marcarLeida.execute(id);
    return { success: true, data: null };
  }

  @Post(':id/escribiendo')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Muestra "escribiendo…" al cliente y marca leído su último mensaje',
    description:
      'Best effort: con la ventana cerrada, sin mensajes del cliente o si Meta lo rechaza, responde igual 200 sin hacer nada.',
  })
  @ZodApiResponse(HttpStatus.OK, sinDatosResponseSchema)
  async escribiendo(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<TSinDatosResponse> {
    await this.indicarEscribiendo.execute(id);
    return { success: true, data: null };
  }

  @Get(':id/cliente-saba')
  @ApiOperation({
    summary:
      'Clientes de Saba con el teléfono del chat (identidad y solicitudes)',
    description:
      'Se consulta al servidor de Saba con la sesión del agente; Saba valida el permiso `/admin/marketing/clientes`.',
  })
  @ZodApiResponse(HttpStatus.OK, clienteSabaChatResponseSchema)
  async clienteSaba(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: Request
  ): Promise<TClienteSabaChatResponse> {
    const credencial = extractBearerToken(req);
    if (!credencial) throw new SesionInvalidaException();
    return toClienteSabaChatResponse(
      await this.obtenerClienteSaba.execute(id, credencial)
    );
  }
}
