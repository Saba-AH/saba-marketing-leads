import { z } from 'zod';
import { LIMITES, maximo } from '../limites';
import { buildSafeResponseSchema } from '../utils';

/** Roles de staff de Saba (`profiles.role`) que pueden entrar al panel. */
export const STAFF_ROLES = ['admin', 'cajero', 'vendedor'] as const;
export const staffRoleSchema = z.enum(STAFF_ROLES);
export type TStaffRole = z.infer<typeof staffRoleSchema>;

/**
 * Códigos de error del login que el cliente distingue: los de bloqueo y
 * rate limit se muestran como advertencia, no como error.
 */
export const AUTH_ERROR_CODES = {
  credencialesInvalidas: 'AUTH_CREDENCIALES_INVALIDAS',
  captchaInvalido: 'AUTH_CAPTCHA_INVALIDO',
  demasiadosIntentos: 'AUTH_DEMASIADOS_INTENTOS',
  cuentaBloqueada: 'AUTH_CUENTA_BLOQUEADA',
  sinAcceso: 'AUTH_SIN_ACCESO',
  sesionInvalida: 'AUTH_SESION_INVALIDA',
} as const;
export type TAuthErrorCode =
  (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

/** Tope de la contraseña: GoTrue no acepta más de 72 bytes (bcrypt). */
const CONTRASENA_MAX = 72;
/** Los tokens de Turnstile rondan los 2 KB. */
const CAPTCHA_TOKEN_MAX = 4096;
/** Los refresh tokens de GoTrue son cortos; el tope solo corta abusos. */
const REFRESH_TOKEN_MAX = 512;

/** Body de `POST /auth/login`. */
export const loginSchema = z.object({
  correo: z
    .email('El correo no es válido.')
    .max(LIMITES.correo, maximo('El correo', LIMITES.correo))
    .transform((correo) => correo.trim().toLowerCase()),
  contrasena: z
    .string()
    .min(1, 'La contraseña es obligatoria.')
    .max(CONTRASENA_MAX, maximo('La contraseña', CONTRASENA_MAX)),
  captchaToken: z
    .string()
    .min(1, 'Completa el CAPTCHA.')
    .max(CAPTCHA_TOKEN_MAX),
});
export type TLogin = z.infer<typeof loginSchema>;

/** Body de `POST /auth/refresh`. */
export const refreshSesionSchema = z.object({
  refreshToken: z.string().min(1).max(REFRESH_TOKEN_MAX),
});
export type TRefreshSesion = z.infer<typeof refreshSesionSchema>;

export const sesionTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  /** Vencimiento del access token, en segundos desde epoch (como `exp`). */
  expiresAt: z.number().int(),
});
export type TSesionTokens = z.infer<typeof sesionTokensSchema>;

/** Quién tiene la sesión: lo que pinta el menú de usuario. */
export const usuarioSesionSchema = z.object({
  id: z.string(),
  correo: z.string(),
  nombre: z.string(),
  rol: staffRoleSchema,
});
export type TUsuarioSesion = z.infer<typeof usuarioSesionSchema>;

export const loginResponseSchema = buildSafeResponseSchema(
  z.object({ sesion: sesionTokensSchema, usuario: usuarioSesionSchema })
);
export type TLoginResponse = z.infer<typeof loginResponseSchema>;

export const refreshSesionResponseSchema =
  buildSafeResponseSchema(sesionTokensSchema);
export type TRefreshSesionResponse = z.infer<
  typeof refreshSesionResponseSchema
>;

export const meResponseSchema = buildSafeResponseSchema(usuarioSesionSchema);
export type TMeResponse = z.infer<typeof meResponseSchema>;
