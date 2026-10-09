export const AUTH_TOKENS = {
  Login: Symbol('LoginPort'),
  RefreshSession: Symbol('RefreshSessionPort'),
  Logout: Symbol('LogoutPort'),
  AuthenticateRequest: Symbol('AuthenticateRequestPort'),
  SabaAuthGateway: Symbol('SabaAuthGatewayPort'),
  CaptchaVerifier: Symbol('CaptchaVerifierPort'),
  SessionCache: Symbol('SessionCachePort'),
  Clock: Symbol('ClockPort'),
  SabaApiConfig: Symbol('SabaApiConfig'),
  Config: Symbol('AuthConfig'),
} as const;
