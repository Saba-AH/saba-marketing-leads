import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class SabaNoDisponibleException extends DomainException {
  constructor(cause?: unknown) {
    super('SABA_CLIENTES_NO_DISPONIBLE', cause);
  }
}

/** Saba respondió 401: el token del agente no es de su Supabase o ya venció. */
export class SabaSesionNoReconocidaException extends DomainException {
  constructor(cause?: unknown) {
    super('SABA_CLIENTES_SESION_NO_RECONOCIDA', cause);
  }
}

export class SabaSinPermisoException extends DomainException {
  constructor(cause?: unknown) {
    super('SABA_CLIENTES_SIN_PERMISO', cause);
  }
}
