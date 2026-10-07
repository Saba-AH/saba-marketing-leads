export interface ReprocesarPendientesPort {
  /** Devuelve cuántos eventos quedaron procesados en esta pasada. */
  execute(): Promise<number>;
}
