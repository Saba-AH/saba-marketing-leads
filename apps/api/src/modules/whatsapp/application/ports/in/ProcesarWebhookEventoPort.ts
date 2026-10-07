/** `omitido`: ya estaba procesado o lo está procesando otra instancia. */
export type ResultadoProcesamiento = 'procesado' | 'omitido' | 'fallido';

export interface ProcesarWebhookEventoPort {
  execute(eventoId: string): Promise<ResultadoProcesamiento>;
}
