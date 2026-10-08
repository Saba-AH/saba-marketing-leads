import type { StaffProfile } from '../../../domain/StaffProfile';

export interface ActiveSessionReaderPort {
  /**
   * The profile that owns the session, or `null` if the session no longer
   * exists (logout, revoked) or expired. One database round trip per
   * authenticated request.
   */
  findProfileBySession(
    userId: string,
    sessionId: string
  ): Promise<StaffProfile | null>;
}
