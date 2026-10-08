import {
  sessionUserSchema,
  type TLogin,
  type TSessionUser,
} from '@repo/schemas';
import { z } from 'zod';
import { LoginError } from '../domain/loginError';
import type { SessionUser } from '../domain/sessionUser.model';
import type { AuthApi } from './auth.interfaces';
import { toSessionUser } from './auth.transform';

/** Response of `POST /api/session/login` (the BFF): the user, without tokens. */
const loginBffResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.object({ user: sessionUserSchema }),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
  }),
]);

const GENERIC_ERROR = 'No se pudo iniciar sesión. Intenta de nuevo.';

/**
 * Panel session. Login and logout go to the BFF (`/api/session/*`), the only
 * one that sees the tokens; `me` goes to the API through the proxy.
 */
export class SessionServiceClass {
  constructor(private readonly authApi: AuthApi) {}

  async login(data: TLogin): Promise<SessionUser> {
    const response = await fetch('/api/session/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).catch(() => null);
    const body = loginBffResponseSchema.safeParse(
      await response?.json().catch(() => null)
    );
    if (!body.success) throw new LoginError(GENERIC_ERROR);
    if (!body.data.success) {
      throw new LoginError(body.data.error, body.data.code);
    }
    return toSessionUser(body.data.data.user);
  }

  async logout(): Promise<void> {
    await fetch('/api/session/logout', { method: 'POST' });
  }

  async currentUser(): Promise<SessionUser> {
    const result = await this.authApi.me();
    if (!result.success) throw new Error(result.error);
    return toSessionUser(result.data satisfies TSessionUser);
  }
}
