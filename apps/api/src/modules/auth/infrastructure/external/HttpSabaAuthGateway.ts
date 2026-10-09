import { Inject, Injectable } from '@nestjs/common';
import { PERMISSIONS, staffRoleSchema, type TPermission } from '@repo/schemas';
import { z } from 'zod';
import {
  type ClientInfo,
  INVALID_SERVICE_KEY_CODE,
  SABA_TIMEOUT_MS,
  type SabaApiConfig,
  sabaErrorCode,
  sabaHeaders,
  sabaUrl,
} from '../../../../infrastructure/saba/sabaApi';
import type {
  SabaAuthGatewayPort,
  SabaLoginResult,
} from '../../application/ports/out/SabaAuthGatewayPort';
import type { AuthenticatedUser, AuthSession } from '../../domain/AuthSession';
import { AccountLockedException } from '../../domain/exceptions/AccountLockedException';
import { AuthUnavailableException } from '../../domain/exceptions/AuthUnavailableException';
import { InvalidCredentialsException } from '../../domain/exceptions/InvalidCredentialsException';
import { InvalidSessionException } from '../../domain/exceptions/InvalidSessionException';
import { NoAccessException } from '../../domain/exceptions/NoAccessException';
import { TooManyAttemptsException } from '../../domain/exceptions/TooManyAttemptsException';
import { AUTH_TOKENS } from '../../tokens';

const sessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresAt: z.number().int(),
  userId: z.string(),
});

// A permission Saba adds before this panel knows it is ignored, not a broken contract.
const KNOWN_PERMISSIONS = new Set<string>(PERMISSIONS);
const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: staffRoleSchema,
  permissions: z
    .array(z.string())
    .transform((granted) =>
      granted.filter((p): p is TPermission => KNOWN_PERMISSIONS.has(p))
    ),
});

const loginSchema = z.object({
  ok: z.literal(true),
  session: sessionSchema,
  user: userSchema,
});
const refreshSchema = z.object({ ok: z.literal(true), session: sessionSchema });
const sessionUserSchema = z.object({ ok: z.literal(true), user: userSchema });

/** Saba's `/api/marketing/*` (routes/marketingPanel.js in the Saba repo). */
@Injectable()
export class HttpSabaAuthGateway implements SabaAuthGatewayPort {
  constructor(
    @Inject(AUTH_TOKENS.SabaApiConfig) private readonly config: SabaApiConfig
  ) {}

  async login(
    email: string,
    password: string,
    client: ClientInfo
  ): Promise<SabaLoginResult> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      client,
    });
    if (!response.ok) throw await loginRejection(response);
    const body = await parse(response, loginSchema);
    return { session: toSession(body.session), user: body.user };
  }

  async refresh(refreshToken: string): Promise<AuthSession | null> {
    const response = await this.request('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (response.status === 401) {
      await rejectInvalidServiceKey(response);
      return null;
    }
    if (!response.ok) throw unexpected('/auth/refresh', response);
    return toSession((await parse(response, refreshSchema)).session);
  }

  async logout(accessToken: string): Promise<void> {
    const response = await this.request('/auth/logout', {
      method: 'POST',
      accessToken,
    });
    if (response.status === 401) {
      await rejectInvalidServiceKey(response);
      return;
    }
    if (!response.ok) throw unexpected('/auth/logout', response);
  }

  async findSessionUser(accessToken: string): Promise<AuthenticatedUser> {
    const response = await this.request('/session', { accessToken });
    if (response.status === 401) {
      await rejectInvalidServiceKey(response);
      throw new InvalidSessionException();
    }
    if (response.status === 403) throw new NoAccessException();
    if (!response.ok) throw unexpected('/session', response);
    return (await parse(response, sessionUserSchema)).user;
  }

  private async request(
    path: string,
    init: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      accessToken?: string;
      client?: ClientInfo;
    }
  ): Promise<Response> {
    try {
      return await fetch(sabaUrl(this.config, path), {
        method: init.method ?? 'GET',
        body: init.body,
        headers: {
          ...init.headers,
          ...sabaHeaders(this.config, {
            accessToken: init.accessToken,
            client: init.client,
          }),
        },
        signal: AbortSignal.timeout(SABA_TIMEOUT_MS),
      });
    } catch (error: unknown) {
      throw new AuthUnavailableException(error);
    }
  }
}

function toSession(session: z.infer<typeof sessionSchema>): AuthSession {
  return {
    userId: session.userId,
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt,
  };
}

/** Same statuses as Saba's `loginAdmin`, plus 403 for `no_marketing_access`. */
async function loginRejection(response: Response): Promise<Error> {
  switch (response.status) {
    case 400:
      return new InvalidCredentialsException();
    case 401:
      return (await sabaErrorCode(response)) === INVALID_SERVICE_KEY_CODE
        ? invalidServiceKey()
        : new InvalidCredentialsException();
    case 403:
      return new NoAccessException();
    case 423:
      return new AccountLockedException();
    case 429:
      return new TooManyAttemptsException();
    default:
      return unexpected('/auth/login', response);
  }
}

async function rejectInvalidServiceKey(response: Response): Promise<void> {
  if ((await sabaErrorCode(response)) === INVALID_SERVICE_KEY_CODE) {
    throw invalidServiceKey();
  }
}

function invalidServiceKey(): AuthUnavailableException {
  return new AuthUnavailableException(
    'Saba rechazó la service key: SABA_SERVICE_KEY no coincide con su MARKETING_SERVICE_KEY'
  );
}

function unexpected(
  path: string,
  response: Response
): AuthUnavailableException {
  return new AuthUnavailableException(
    `Saba ${path} respondió ${response.status}`
  );
}

async function parse<T extends z.ZodType>(
  response: Response,
  schema: T
): Promise<z.infer<T>> {
  const body = schema.safeParse(await response.json().catch(() => null));
  if (!body.success) {
    throw new AuthUnavailableException('respuesta de Saba con otra forma');
  }
  return body.data;
}
