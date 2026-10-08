/** Lead as it lives in the domain. See `@repo/schemas` for the contract. */
export interface Lead {
  id: string;
  name: string;
  email: string;
  source: string | null;
  createdAt: Date;
}

/** Input of `create`: plain values, already validated at the edge. */
export interface LeadData {
  name: string;
  email: string;
  source?: string;
}
