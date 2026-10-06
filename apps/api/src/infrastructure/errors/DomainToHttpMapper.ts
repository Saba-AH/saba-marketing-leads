import { HttpStatus } from '@nestjs/common';
import type { DomainErrorCode } from '../i18n/domainMessages';

/**
 * Estado HTTP por código de dominio. El tipo `Record<DomainErrorCode, ...>`
 * hace que un código nuevo en `domainMessages` sin su entrada acá sea un
 * error de `tsc`, no un 500 enmascarado descubierto en producción.
 */
export const domainErrorHttpStatus: Record<DomainErrorCode, HttpStatus> = {
  LEADS_CORREO_DUPLICADO: HttpStatus.CONFLICT,
};

export function mapDomainErrorToHttpStatus(code: string): HttpStatus {
  return (
    (domainErrorHttpStatus as Record<string, HttpStatus>)[code] ??
    HttpStatus.INTERNAL_SERVER_ERROR
  );
}
