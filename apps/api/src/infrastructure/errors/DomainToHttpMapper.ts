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
  WHATSAPP_CONVERSACION_NO_ENCONTRADA: HttpStatus.NOT_FOUND,
  WHATSAPP_VENTANA_CERRADA: HttpStatus.CONFLICT,
  WHATSAPP_MEDIA_NO_DISPONIBLE: HttpStatus.NOT_FOUND,
  WHATSAPP_CONTACTO_SIN_TELEFONO: HttpStatus.UNPROCESSABLE_ENTITY,
  WHATSAPP_DESTINATARIO_NO_PERMITIDO: HttpStatus.UNPROCESSABLE_ENTITY,
  WHATSAPP_NO_ENTREGABLE: HttpStatus.UNPROCESSABLE_ENTITY,
  WHATSAPP_DEMASIADOS_ENVIOS: HttpStatus.TOO_MANY_REQUESTS,
  // 424 y no 5xx: un 5xx se publica como INTERNAL_ERROR y el agente necesita
  // saber que el problema está en Meta o en la configuración, no en el panel.
  WHATSAPP_NO_CONFIGURADO: HttpStatus.FAILED_DEPENDENCY,
  WHATSAPP_TOKEN_INVALIDO: HttpStatus.FAILED_DEPENDENCY,
  WHATSAPP_ENVIO_RECHAZADO: HttpStatus.FAILED_DEPENDENCY,
  WHATSAPP_PAYLOAD_WEBHOOK_INVALIDO: HttpStatus.UNPROCESSABLE_ENTITY,
  WHATSAPP_SUSCRIPCION_WEBHOOK_RECHAZADA: HttpStatus.FORBIDDEN,
};

export function mapDomainErrorToHttpStatus(code: string): HttpStatus {
  return (
    (domainErrorHttpStatus as Record<string, HttpStatus>)[code] ??
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
