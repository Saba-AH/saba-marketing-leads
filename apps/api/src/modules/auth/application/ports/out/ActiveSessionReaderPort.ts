import type { StaffProfile } from '../../../domain/StaffProfile';

export interface ActiveSessionReaderPort {
  /**
   * El perfil dueño de la sesión, o `null` si la sesión ya no existe (logout,
   * revocada) o venció. Una sola ida a la base por petición autenticada.
   */
  findProfileBySession(
    userId: string,
    sessionId: string
  ): Promise<StaffProfile | null>;
}
