export interface WebhookEventPublisherPort {
  /**
   * Avisa que hay eventos por procesar. No lanza: si el aviso se pierde, el
   * evento ya está guardado y el barrido periódico lo recoge.
   */
  publicarRecibidos(eventoIds: string[]): void;
}
