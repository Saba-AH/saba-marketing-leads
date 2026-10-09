import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface SwaggerCredentials {
  user: string;
  password: string;
}

/**
 * What to do with Swagger depending on the environment:
 * - `protected`: there are credentials → Basic Auth.
 * - `open`: no credentials outside production → open (local development).
 * - `disabled`: no credentials in production → not mounted. Fail-closed: a
 *   forgotten setting does not leave the API docs exposed.
 */
export type SwaggerAccess =
  | { mode: 'protected'; credentials: SwaggerCredentials }
  | { mode: 'open' }
  | { mode: 'disabled' };

export function resolveSwaggerAccess(
  env: NodeJS.ProcessEnv = process.env
): SwaggerAccess {
  const user = env.SWAGGER_USER?.trim();
  const password = env.SWAGGER_PASSWORD;
  if (user && password) {
    return { mode: 'protected', credentials: { user, password } };
  }
  return env.NODE_ENV === 'production'
    ? { mode: 'disabled' }
    : { mode: 'open' };
}

/** Constant-time comparison: timing does not leak how much matched. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function isAuthorized(
  header: string | undefined,
  credentials: SwaggerCredentials
): boolean {
  if (!header?.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator === -1) return false;
  const user = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);
  // Always both: stopping at the user would reveal the user was valid.
  const userOk = safeEqual(user, credentials.user);
  const passwordOk = safeEqual(password, credentials.password);
  return userOk && passwordOk;
}

export function swaggerBasicAuth(credentials: SwaggerCredentials) {
  return function swaggerBasicAuthMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    if (isAuthorized(req.headers.authorization, credentials)) {
      next();
      return;
    }
    res
      .status(401)
      .set('WWW-Authenticate', 'Basic realm="Swagger", charset="UTF-8"')
      .send('Autenticación requerida');
  };
}
