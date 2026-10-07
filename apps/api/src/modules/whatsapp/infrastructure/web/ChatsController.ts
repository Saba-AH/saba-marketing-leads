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
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  conversacionesResponseSchema,
  enviarMensajeSchema,
  mensajeResponseSchema,
  mensajesResponseSchema,
  sinDatosResponseSchema,
  type TConversacionesResponse,
  type TMensajeResponse,
  type TMensajesResponse,
  type TSinDatosResponse,
} from '@repo/schemas';
import {
  ZodApiBody,
  ZodApiResponse,
} from '../../../../shared/decorators/zodSwagger';
import { createZodDto } from '../../../../shared/utils/createZodDto';
import type { AuthenticatedUser } from '../../../auth/domain/AuthSession';
import { CurrentUser } from '../../../auth/infrastructure/web/CurrentUser';
import type { ListarConversacionesPort } from '../../application/ports/in/ListarConversacionesPort';
import type { ListarMensajesPort } from '../../application/ports/in/ListarMensajesPort';
import type { MarcarLeidaPort } from '../../application/ports/in/MarcarLeidaPort';
import type { ResponderConversacionPort } from '../../application/ports/in/ResponderConversacionPort';
import { WHATSAPP_TOKENS } from '../../tokens';
import {
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
    private readonly marcarLeida: MarcarLeidaPort
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
}
