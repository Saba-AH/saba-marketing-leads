import type { ClientInfo } from '../../../../../infrastructure/saba/sabaApi';
import type {
  AuthenticatedUser,
  AuthSession,
} from '../../../domain/AuthSession';

export interface LoginCommand {
  email: string;
  password: string;
  captchaToken: string;
  client: ClientInfo;
}

export interface LoginResult {
  session: AuthSession;
  user: AuthenticatedUser;
}

export interface LoginPort {
  execute(command: LoginCommand): Promise<LoginResult>;
}
