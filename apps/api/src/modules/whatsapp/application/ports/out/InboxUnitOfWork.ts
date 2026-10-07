import type {
  CambioEstadoMensaje,
  EstadoMensaje,
  IdentidadContacto,
  MensajeEntrante,
} from '../../../domain/Inbox';

export interface EventoWebhookPendiente {
  id: string;
  campo: string;
  payload: unknown;
}

/** Operaciones ligadas a una sola transacción: todo o nada por evento. */
export interface InboxTxScope {
  /** Bloquea el evento si sigue sin procesar; `null` si ya se procesó o lo tiene otra instancia. */
  tomarEvento(eventoId: string): Promise<EventoWebhookPendiente | null>;
  marcarProcesado(eventoId: string): Promise<void>;
  /** Busca por `user_id` o por teléfono, completa lo que falte y devuelve el id. */
  asegurarContacto(
    identidad: IdentidadContacto,
    profileName: string | null
  ): Promise<string>;
  asegurarConversacion(contactId: string): Promise<string>;
  /** `false` si el `wamid` ya existía (Meta reenvía webhooks). */
  insertarMensajeEntrante(
    conversationId: string,
    mensaje: MensajeEntrante
  ): Promise<boolean>;
  registrarEntrante(
    conversationId: string,
    mensaje: MensajeEntrante
  ): Promise<void>;
  /** Solo cambia los mensajes que están en alguno de `desde`. */
  actualizarEstadoMensaje(
    cambio: CambioEstadoMensaje,
    desde: EstadoMensaje[]
  ): Promise<void>;
}

export interface InboxUnitOfWork {
  run<T>(work: (scope: InboxTxScope) => Promise<T>): Promise<T>;
}
