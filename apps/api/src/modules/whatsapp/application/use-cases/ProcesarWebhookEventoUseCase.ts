import { Inject, Injectable } from '@nestjs/common';
import { PayloadWebhookInvalidoException } from '../../domain/exceptions/PayloadWebhookInvalidoException';
import { type AccionInbox, estadosQueAvanzanA } from '../../domain/Inbox';
import { interpretarWebhook } from '../../domain/interpretarWebhook';
import { WHATSAPP_TOKENS } from '../../tokens';
import type {
  ProcesarWebhookEventoPort,
  ResultadoProcesamiento,
} from '../ports/in/ProcesarWebhookEventoPort';
import type { ClienteSabaReaderPort } from '../ports/out/ClienteSabaReaderPort';
import type {
  ContactoInbox,
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
 *
 * El vínculo con Saba va después del commit: leer `profiles` por otra conexión
 * con la transacción abierta se traba contra cualquier bloqueo exclusivo sobre
 * esa tabla (una migración de Saba, un TRUNCATE).
 */
@Injectable()
export class ProcesarWebhookEventoUseCase implements ProcesarWebhookEventoPort {
  constructor(
    @Inject(WHATSAPP_TOKENS.InboxUnitOfWork)
    private readonly uow: InboxUnitOfWork,
    @Inject(WHATSAPP_TOKENS.WebhookEventRepository)
    private readonly eventos: WebhookEventRepositoryPort,
    @Inject(WHATSAPP_TOKENS.ClienteSabaReader)
    private readonly clientesSaba: ClienteSabaReaderPort
  ) {}

  async execute(eventoId: string): Promise<ResultadoProcesamiento> {
    let porVincular: ContactoInbox[] | null;
    try {
      porVincular = await this.uow.run(async (scope) => {
        const evento = await scope.tomarEvento(eventoId);
        if (!evento) return null;
        const contactos: ContactoInbox[] = [];
        // En orden: un payload puede traer el mensaje y luego su estado.
        for (const accion of interpretarWebhook(evento.campo, evento.payload)) {
          const contacto = await this.aplicar(scope, accion);
          if (contacto) contactos.push(contacto);
        }
        await scope.marcarProcesado(eventoId);
        return contactos;
      });
    } catch (error: unknown) {
      await this.eventos.registrarFallo(eventoId, describirError(error));
      return 'fallido';
    }
    if (porVincular === null) return 'omitido';

    // Si esto falla el evento ya quedó procesado: el vínculo se reintenta con
    // el siguiente mensaje del contacto, y el error sube para que se registre.
    await this.vincularConSaba(porVincular);
    return 'procesado';
  }

  /** Devuelve el contacto si el mensaje fue entrante. */
  private async aplicar(
    scope: InboxTxScope,
    accion: AccionInbox
  ): Promise<ContactoInbox | null> {
    switch (accion.tipo) {
      case 'mensajeEntrante': {
        const { mensaje } = accion;
        const contacto = await scope.asegurarContacto(
          mensaje.identidad,
          mensaje.profileName
        );
        const conversationId = await scope.asegurarConversacion(contacto.id);
        const esNuevo = await scope.insertarMensajeEntrante(
          conversationId,
          mensaje
        );
        if (esNuevo) await scope.registrarEntrante(conversationId, mensaje);
        return contacto;
      }
      case 'estadoMensaje':
        await scope.actualizarEstadoMensaje(
          accion.cambio,
          estadosQueAvanzanA(accion.cambio.estado)
        );
        return null;
    }
  }

  /**
   * Se intenta en cada mensaje mientras el contacto no tenga vínculo: un lead
   * que después se registra en Saba queda vinculado en su siguiente mensaje.
   */
  private async vincularConSaba(contactos: ContactoInbox[]): Promise<void> {
    const pendientes = new Map<string, string>();
    for (const c of contactos) {
      if (c.vinculoOrigen === null && c.waId) pendientes.set(c.id, c.waId);
    }
    // Casi siempre es un solo contacto por evento.
    for (const [contactId, waId] of pendientes) {
      const [mejor] = await this.clientesSaba.candidatosPorTelefono(waId);
      if (mejor) {
        await this.uow.run((scope) =>
          scope.vincularAutomaticamente(contactId, mejor)
        );
      }
    }
  }
}
