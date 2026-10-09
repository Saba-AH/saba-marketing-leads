import type { TAuthErrorCode } from '@repo/schemas';

export const authMessages = {
  AUTH_INVALID_CREDENTIALS:
    'Credenciales inválidas. Verifica tu correo y contraseña.',
  AUTH_INVALID_CAPTCHA: 'No pudimos validar el CAPTCHA. Intenta de nuevo.',
  AUTH_TOO_MANY_ATTEMPTS:
    'Demasiados intentos. Espera unos minutos e intenta de nuevo.',
  AUTH_ACCOUNT_LOCKED:
    'Tu cuenta fue bloqueada por intentos fallidos. Contacta a un administrador para desbloquearla.',
  AUTH_NO_ACCESS:
    'Tu cuenta no tiene acceso al panel de marketing. Pide que lo activen en tu perfil de Saba.',
  AUTH_INVALID_SESSION: 'Tu sesión expiró. Inicia sesión de nuevo.',
  AUTH_PERMISSION_DENIED: 'No tienes permiso para hacer esto.',
  AUTH_UNAVAILABLE:
    'No pudimos validar tu sesión con Saba en este momento. Intenta de nuevo en unos segundos.',
} as const satisfies Record<TAuthErrorCode, string>;
