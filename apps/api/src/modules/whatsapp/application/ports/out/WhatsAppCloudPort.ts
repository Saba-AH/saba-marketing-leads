import type { ArchivoMedia } from '../../../domain/Chats';

export interface WhatsAppCloudPort {
  /**
   * Devuelve el `wamid` con que Meta aceptó el mensaje. Lanza `ErrorEnvioMeta`
   * si Meta lo rechaza y `WhatsAppNoConfiguradoException` si faltan credenciales.
   */
  enviarTexto(to: string, cuerpo: string): Promise<string>;
  /** Lanza `ErrorEnvioMeta` si Meta ya no lo tiene (lo guarda ~30 días). */
  descargarMedia(mediaId: string): Promise<ArchivoMedia>;
}
