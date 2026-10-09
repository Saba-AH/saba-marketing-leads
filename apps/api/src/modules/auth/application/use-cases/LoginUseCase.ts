import { Inject, Injectable } from '@nestjs/common';
import { InvalidCaptchaException } from '../../domain/exceptions/InvalidCaptchaException';
import { AUTH_TOKENS } from '../../tokens';
import type {
  LoginCommand,
  LoginPort,
  LoginResult,
} from '../ports/in/LoginPort';
import type { CaptchaVerifierPort } from '../ports/out/CaptchaVerifierPort';
import type { SabaAuthGatewayPort } from '../ports/out/SabaAuthGatewayPort';

/**
 * The CAPTCHA is solved here; everything else (rate limit, lockout, access
 * flag) is Saba's staff login, so both portals lock an account the same way.
 */
@Injectable()
export class LoginUseCase implements LoginPort {
  constructor(
    @Inject(AUTH_TOKENS.CaptchaVerifier)
    private readonly captcha: CaptchaVerifierPort,
    @Inject(AUTH_TOKENS.SabaAuthGateway)
    private readonly saba: SabaAuthGatewayPort
  ) {}

  async execute(command: LoginCommand): Promise<LoginResult> {
    if (!(await this.captcha.verify(command.captchaToken, command.client.ip))) {
      throw new InvalidCaptchaException();
    }
    return this.saba.login(command.email, command.password, command.client);
  }
}
