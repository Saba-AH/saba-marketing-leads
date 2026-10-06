export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
}

export interface AccessTokenVerifierPort {
  /** `null` si el token no es válido (firma, vencimiento, emisor o audiencia). */
  verify(token: string): Promise<AccessTokenClaims | null>;
}
