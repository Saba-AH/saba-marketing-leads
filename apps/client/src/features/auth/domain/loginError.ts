import { AUTH_ERROR_CODES } from '@repo/schemas';

/**
 * Bloqueo y rate limit no son un error de quien escribe: se muestran como
 * advertencia (amarillo), igual que en el login de Saba.
 */
const CODIGOS_ADVERTENCIA: ReadonlySet<string> = new Set([
  AUTH_ERROR_CODES.cuentaBloqueada,
  AUTH_ERROR_CODES.demasiadosIntentos,
]);

export type TipoAvisoLogin = 'error' | 'advertencia';

export class LoginError extends Error {
  readonly tipo: TipoAvisoLogin;

  constructor(mensaje: string, codigo?: string) {
    super(mensaje);
    this.name = 'LoginError';
    this.tipo =
      codigo && CODIGOS_ADVERTENCIA.has(codigo) ? 'advertencia' : 'error';
  }
}
