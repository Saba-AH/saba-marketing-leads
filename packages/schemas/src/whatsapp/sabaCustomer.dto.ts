import { z } from 'zod';
import { buildSafeResponseSchema } from '../utils';

/** A customer's application, as Saba's server summarizes it (`/admin/marketing/customers`). */
export const sabaApplicationSchema = z.object({
  id: z.string(),
  status: z.string(),
  /** In readable text ("Cita agendada"), not the internal code. */
  statusLabel: z.string(),
  active: z.boolean(),
  createdAt: z.string(),
  product: z.string().nullable(),
  financedAmount: z.number().nullable(),
  installmentAmount: z.number().nullable(),
  frequency: z.string().nullable(),
});
export type TSabaApplication = z.infer<typeof sabaApplicationSchema>;

export const sabaCustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  idNumber: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  city: z.string().nullable(),
  source: z.string().nullable(),
  customerSince: z.string().nullable(),
  applications: z.array(sabaApplicationSchema),
});
export type TSabaCustomer = z.infer<typeof sabaCustomerSchema>;

export const chatSabaCustomersSchema = z.object({
  /** The contact only shares their WhatsApp username: there is nothing to search with. */
  noPhone: z.boolean(),
  /** Saba profiles with that phone, most likely first (max. 5). */
  customers: z.array(sabaCustomerSchema),
});
export type TChatSabaCustomers = z.infer<typeof chatSabaCustomersSchema>;

export const chatSabaCustomersResponseSchema = buildSafeResponseSchema(
  chatSabaCustomersSchema
);
export type TChatSabaCustomersResponse = z.infer<
  typeof chatSabaCustomersResponseSchema
>;
