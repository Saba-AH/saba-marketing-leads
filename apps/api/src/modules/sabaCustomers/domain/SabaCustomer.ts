export interface SabaApplication {
  id: string;
  status: string;
  statusLabel: string;
  active: boolean;
  createdAt: string;
  product: string | null;
  financedAmount: number | null;
  installmentAmount: number | null;
  frequency: string | null;
}

/** What Saba considers the important information about a customer (identity + applications). */
export interface SabaCustomer {
  id: string;
  name: string;
  idNumber: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  source: string | null;
  customerSince: string | null;
  /** The last 5, most recent first. */
  applications: SabaApplication[];
}
