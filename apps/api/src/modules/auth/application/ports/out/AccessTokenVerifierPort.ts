export interface AccessTokenClaims {
  userId: string;
  sessionId: string;
}

export interface AccessTokenVerifierPort {
  /** `null` if the token is not valid (signature, expiry, issuer or audience). */
  verify(token: string): Promise<AccessTokenClaims | null>;
}
