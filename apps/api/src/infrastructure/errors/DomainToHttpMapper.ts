import { HttpStatus } from '@nestjs/common';
import type { DomainErrorCode } from '../i18n/domainMessages';

/**
 * Estado HTTP por código de dominio. El tipo `Record<DomainErrorCode, ...>`
 * hace que un código nuevo en `domainMessages` sin su entrada acá sea un
 * error de `tsc`, no un 500 enmascarado descubierto en producción.
 */
export const domainErrorHttpStatus: Record<DomainErrorCode, HttpStatus> = {
  AUTH_CREDENCIALES_INVALIDAS: HttpStatus.UNAUTHORIZED,
  AUTH_CAPTCHA_INVALIDO: HttpStatus.BAD_REQUEST,
  AUTH_DEMASIADOS_INTENTOS: HttpStatus.TOO_MANY_REQUESTS,
  AUTH_CUENTA_BLOQUEADA: HttpStatus.LOCKED,
  AUTH_SIN_ACCESO: HttpStatus.FORBIDDEN,
  AUTH_SESION_INVALIDA: HttpStatus.UNAUTHORIZED,
  LEADS_CORREO_DUPLICADO: HttpStatus.CONFLICT,
  WHATSAPP_FIRMA_WEBHOOK_INVALIDA: HttpStatus.UNAUTHORIZED,
  WHATSAPP_PAYLOAD_WEBHOOK_INVALIDO: HttpStatus.UNPROCESSABLE_ENTITY,
  WHATSAPP_SUSCRIPCION_WEBHOOK_RECHAZADA: HttpStatus.FORBIDDEN,
};

export function mapDomainErrorToHttpStatus(code: string): HttpStatus {
  return (
    (domainErrorHttpStatus as Record<string, HttpStatus>)[code] ??
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
