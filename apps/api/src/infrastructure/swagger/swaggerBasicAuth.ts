import { timingSafeEqual } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export interface SwaggerCredentials {
  user: string;
  password: string;
}

/**
 * Qué hacer con Swagger según el entorno:
 * - `protected`: hay credenciales → Basic Auth.
 * - `open`: sin credenciales fuera de producción → abierto (desarrollo local).
 * - `disabled`: sin credenciales en producción → no se monta. Fail-closed: un
 *   olvido de configuración no deja la documentación de la API expuesta.
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
  return env.NODE_ENV === 'production' ? { mode: 'disabled' } : { mode: 'open' };
}

/** Comparación en tiempo constante: no filtra por timing cuánto acertó. */
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
  // Ambas siempre: cortar en el usuario revelaría que el usuario era válido.
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
