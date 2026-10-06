import type { Request } from 'express';
import type { AuthenticatedUser } from '../../domain/AuthSession';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
