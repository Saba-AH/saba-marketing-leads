import type { ArchivoMedia } from '../../../domain/Chats';

export interface ObtenerMediaPort {
  execute(mensajeId: string): Promise<ArchivoMedia>;
}
