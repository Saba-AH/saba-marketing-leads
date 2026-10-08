import type {
  AuthenticatedUser,
  AuthSession,
} from '../../../domain/AuthSession';

export interface LoginCommand {
  email: string;
  password: string;
  captchaToken: string;
  ip: string | null;
  userAgent: string | null;
}

export interface LoginResult {
  session: AuthSession;
  user: AuthenticatedUser;
}

export interface LoginPort {
  execute(command: LoginCommand): Promise<LoginResult>;
}
