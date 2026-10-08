import type { SabaCustomer } from '../../../../sabaCustomers/domain/SabaCustomer';

/** What the chat needs from Saba; fulfilled by the reader `sabaCustomers` exports. */
export interface SabaCustomersPort {
  findByPhone(phone: string, credential: string): Promise<SabaCustomer[]>;
}
