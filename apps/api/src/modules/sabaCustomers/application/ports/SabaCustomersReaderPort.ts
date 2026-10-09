import type { SabaCustomer } from '../../domain/SabaCustomer';

/** Facade over Saba's server: this repo no longer reads Saba's tables. */
export interface SabaCustomersReaderPort {
  /**
   * Saba profiles with that phone, most likely first (max. 5). `credential` is
   * the agent's session token: Saba validates who is asking.
   */
  findByPhone(phone: string, credential: string): Promise<SabaCustomer[]>;
}
