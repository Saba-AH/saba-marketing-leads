/** Id sets a step contributes and the following steps use to filter. */
export type SyncKey = 'emails' | 'userIds' | 'applicationIds' | 'paymentIds';

export interface SyncStep {
  /** `esquema.tabla`. */
  table: string;
  /**
   * Filter with `$1` = the values of `key`. Without a filter, the whole table is
   * copied (catalogs with no personal data).
   */
  where?: { sql: string; key: SyncKey };
  /** The `id`s of the copied rows feed this set. */
  produces?: SyncKey;
  /** Only cleaned up locally (sessions of the replaced users); never copied. */
  deleteOnly?: boolean;
}

/**
 * What gets copied and in which order: each step filters with the ids the
 * previous ones left. Local deletion walks the list backwards.
 */
export const SYNC_PLAN: readonly SyncStep[] = [
  // Cuenta
  {
    table: 'auth.users',
    where: { sql: 'lower(email) = ANY($1::text[])', key: 'emails' },
    produces: 'userIds',
  },
  {
    table: 'auth.identities',
    where: { sql: 'user_id = ANY($1::uuid[])', key: 'userIds' },
  },
  {
    table: 'auth.sessions',
    where: { sql: 'user_id = ANY($1::uuid[])', key: 'userIds' },
    deleteOnly: true,
  },
  {
    table: 'auth.refresh_tokens',
    where: { sql: 'user_id = ANY($1::text[])', key: 'userIds' },
    deleteOnly: true,
  },
  {
    table: 'public.profiles',
    where: { sql: 'id = ANY($1::uuid[])', key: 'userIds' },
  },
  // The user's own data
  {
    table: 'public.user_documents',
    where: { sql: 'user_id = ANY($1::uuid[])', key: 'userIds' },
  },
  {
    table: 'public.notifications',
    where: { sql: 'user_id = ANY($1::uuid[])', key: 'userIds' },
  },
  // Applications and everything hanging from each one
  {
    table: 'public.applications',
    where: { sql: 'user_id = ANY($1::uuid[])', key: 'userIds' },
    produces: 'applicationIds',
  },
  {
    table: 'public.application_documents',
    where: { sql: 'application_id = ANY($1::uuid[])', key: 'applicationIds' },
  },
  {
    table: 'public.application_rejection_reasons',
    where: { sql: 'application_id = ANY($1::uuid[])', key: 'applicationIds' },
  },
  {
    table: 'public.installments',
    where: { sql: 'application_id = ANY($1::uuid[])', key: 'applicationIds' },
  },
  {
    table: 'public.payments',
    where: { sql: 'application_id = ANY($1::uuid[])', key: 'applicationIds' },
    produces: 'paymentIds',
  },
  {
    table: 'public.payments_installments',
    where: { sql: 'payment_id = ANY($1::uuid[])', key: 'paymentIds' },
  },
  {
    table: 'public.appointments',
    where: { sql: 'application_id = ANY($1::uuid[])', key: 'applicationIds' },
  },
  // Full catalogs
  { table: 'public.products' },
  { table: 'public.product_variant_attributes' },
  { table: 'public.product_variant_attribute_values' },
  { table: 'public.payment_interest_rules' },
  { table: 'public.stores' },
  { table: 'public.providers' },
  { table: 'public.payment_methods' },
];
