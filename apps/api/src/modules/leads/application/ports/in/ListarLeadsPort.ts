import type { Lead } from '../../../domain/Lead';

export interface ListarLeadsPort {
  execute(): Promise<Lead[]>;
}
