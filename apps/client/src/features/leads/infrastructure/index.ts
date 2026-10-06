import { getAPIClient } from '@/lib/api';
import { LeadsServiceClass } from './leads.service';

const api = getAPIClient();
export const LeadsService = new LeadsServiceClass(api.v1.leads);
