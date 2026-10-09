import type { SabaCustomer } from '../../../../sabaCustomers/domain/SabaCustomer';

export interface ChatSabaCustomers {
  noPhone: boolean;
  customers: SabaCustomer[];
}

export interface GetSabaCustomerPort {
  /** `credential`: the agent's session token, which Saba validates again. */
  execute(
    conversationId: string,
    credential: string
  ): Promise<ChatSabaCustomers>;
}
