import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class InvalidCaptchaException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_INVALID_CAPTCHA', cause);
  }
}
