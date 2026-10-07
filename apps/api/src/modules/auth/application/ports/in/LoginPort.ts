import type {
  AuthenticatedUser,
  AuthSession,
} from '../../../domain/AuthSession';

export interface LoginCommand {
  correo: string;
  contrasena: string;
  captchaToken: string;
  ip: string | null;
  userAgent: string | null;
}

export interface LoginResult {
  sesion: AuthSession;
  usuario: AuthenticatedUser;
}

export interface LoginPort {
  execute(command: LoginCommand): Promise<LoginResult>;
}
