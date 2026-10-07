export interface SolicitudSuscripcionWebhook {
  mode: string | undefined;
  verifyToken: string | undefined;
  challenge: string | undefined;
}

export interface VerificarSuscripcionWebhookPort {
  /** Devuelve el `challenge` que Meta espera de vuelta. */
  execute(solicitud: SolicitudSuscripcionWebhook): string;
}
