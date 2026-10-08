import { AUTH_ERROR_CODES } from '@repo/schemas';

/**
 * Lockout and rate limit are not the user's typing mistake: they are shown as
 * a warning (yellow), just like in Saba's login.
 */
const WARNING_CODES: ReadonlySet<string> = new Set([
  AUTH_ERROR_CODES.accountLocked,
  AUTH_ERROR_CODES.tooManyAttempts,
]);

export type LoginNoticeKind = 'error' | 'warning';

export class LoginError extends Error {
  readonly type: LoginNoticeKind;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'LoginError';
    this.type = code && WARNING_CODES.has(code) ? 'warning' : 'error';
  }
}
