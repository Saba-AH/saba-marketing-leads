export const AUTH_TOKENS = {
  Login: Symbol('LoginPort'),
  RefreshSesion: Symbol('RefreshSesionPort'),
  Logout: Symbol('LogoutPort'),
  AuthenticateRequest: Symbol('AuthenticateRequestPort'),
  AuthProvider: Symbol('AuthProviderPort'),
  CaptchaVerifier: Symbol('CaptchaVerifierPort'),
  StaffDirectory: Symbol('StaffDirectoryPort'),
  LoginAttempts: Symbol('LoginAttemptsPort'),
  AccessTokenVerifier: Symbol('AccessTokenVerifierPort'),
  ActiveSessionReader: Symbol('ActiveSessionReaderPort'),
  Clock: Symbol('ClockPort'),
  Config: Symbol('AuthConfig'),
} as const;
