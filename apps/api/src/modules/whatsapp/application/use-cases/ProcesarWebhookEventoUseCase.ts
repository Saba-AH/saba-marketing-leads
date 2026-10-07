import { Inject, Injectable } from '@nestjs/common';
import { PayloadWebhookInvalidoException } from '../../domain/exceptions/PayloadWebhookInvalidoException';
import { type AccionInbox, estadosQueAvanzanA } from '../../domain/Inbox';
import { interpretarWebhook } from '../../domain/interpretarWebhook';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  ProcesarWebhookEventoPort,
  ResultadoProcesamiento,
} from '../ports/in/ProcesarWebhookEventoPort';
import type {
  InboxTxScope,
  InboxUnitOfWork,
} from '../ports/out/InboxUnitOfWork';
import type { WebhookEventRepositoryPort } from '../ports/out/WebhookEventRepositoryPort';

function describirError(error: unknown): string {
  if (error instanceof PayloadWebhookInvalidoException) {
    return `${error.message}: ${error.detalle}`;
  }
  return error instanceof Error ? error.message : String(error);
}

/**
 * Lo llaman el handler del evento (al instante) y el barrido (reintentos): un
 * evento se procesa entero en una transacción y se marca, así que correrlo dos
 * veces no duplica nada.
 */
@Injectable()
export class ProcesarWebhookEventoUseCase implements ProcesarWebhookEventoPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.InboxUnitOfWork)
    private readonly uow: InboxUnitOfWork,
    @Inject(WHATSAPP_TOKENS.WebhookEventRepository)
    private readonly eventos: WebhookEventRepositoryPort
  ) {}

  async execute(eventoId: string): Promise<ResultadoProcesamiento> {
    try {
      const procesado = await this.uow.run(async (scope) => {
        const evento = await scope.tomarEvento(eventoId);
        if (!evento) return false;
        // En orden: un payload puede traer el mensaje y luego su estado.
        for (const accion of interpretarWebhook(evento.campo, evento.payload)) {
          await this.aplicar(scope, accion);
        }
        await scope.marcarProcesado(eventoId);
        return true;
      });
      return procesado ? 'procesado' : 'omitido';
    } catch (error: unknown) {
      await this.eventos.registrarFallo(eventoId, describirError(error));
      return 'fallido';
    }
  }

  private async aplicar(
    scope: InboxTxScope,
    accion: AccionInbox
  ): Promise<void> {
    switch (accion.tipo) {
      case 'mensajeEntrante': {
        const { mensaje } = accion;
        const contactId = await scope.asegurarContacto(
          mensaje.identidad,
          mensaje.profileName
        );
        const conversationId = await scope.asegurarConversacion(contactId);
        const esNuevo = await scope.insertarMensajeEntrante(
          conversationId,
          mensaje
        );
        if (esNuevo) await scope.registrarEntrante(conversationId, mensaje);
        return;
      }
      case 'estadoMensaje':
        await scope.actualizarEstadoMensaje(
          accion.cambio,
          estadosQueAvanzanA(accion.cambio.estado)
        );
        return;
    }
  }
}
