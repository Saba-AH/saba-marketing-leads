import { DomainException } from '../../../../infrastructure/errors/DomainException';

export class CaptchaInvalidoException extends DomainException {
  constructor(cause?: unknown) {
    super('AUTH_CAPTCHA_INVALIDO', cause);
  }
}
