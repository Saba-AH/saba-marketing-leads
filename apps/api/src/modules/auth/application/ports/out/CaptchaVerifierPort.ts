export interface CaptchaVerifierPort {
  verify(token: string, ip: string | null): Promise<boolean>;
}
