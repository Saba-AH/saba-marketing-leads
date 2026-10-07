import { getAPIClient } from '@/lib/api';
import { SessionServiceClass } from './session.service';

const api = getAPIClient();
export const SessionService = new SessionServiceClass(api.v1.auth);
