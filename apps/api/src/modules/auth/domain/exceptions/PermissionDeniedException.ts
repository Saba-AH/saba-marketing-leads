import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class PermissionDeniedException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_PERMISSION_DENIED', cause);
  }
}
