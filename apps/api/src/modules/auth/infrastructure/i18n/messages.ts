import type { TAuthErrorCode } from '@repo/schemas';

export const authMessages = {
  AUTH_CREDENCIALES_INVALIDAS:
    'Credenciales inválidas. Verifica tu correo y contraseña.',
  AUTH_CAPTCHA_INVALIDO: 'No pudimos validar el CAPTCHA. Intenta de nuevo.',
  AUTH_DEMASIADOS_INTENTOS:
    'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  AUTH_CUENTA_BLOQUEADA:
    'Tu cuenta fue bloqueada por intentos fallidos. Contacta a un administrador para desbloquearla.',
  AUTH_SIN_ACCESO: 'Tu cuenta no tiene acceso a este panel.',
  AUTH_SESION_INVALIDA: 'Tu sesión expiró. Inicia sesión de nuevo.',
} as const satisfies Record<TAuthErrorCode, string>;
