import { getAPIClient } from '@/lib/api';
import { SystemStatusServiceClass } from './systemStatus.service';

const api = getAPIClient();
export const SystemStatusService = new SystemStatusServiceClass(api.v1.health);
