import type { Lead } from '../../../domain/Lead';

export interface ListLeadsPort {
  execute(): Promise<Lead[]>;
}
