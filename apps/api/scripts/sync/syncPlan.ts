/** Conjuntos de ids que un paso aporta y los siguientes usan para filtrar. */
export type SyncKey = 'emails' | 'userIds' | 'applicationIds' | 'paymentIds';

export interface SyncStep {
  /** `esquema.tabla`. */
  table: string;
  /**
   * Filtro con `$1` = los valores de `key`. Sin filtro, la tabla va completa
   * (catálogos sin datos personales).
   */
  where?: { sql: string; key: SyncKey };
  /** Los `id` de las filas copiadas alimentan este conjunto. */
  produces?: SyncKey;
  /** Solo se limpia en local (sesiones de los usuarios reemplazados); no se copia. */
  deleteOnly?: boolean;
}

/**
 * Qué se copia y en qué orden: cada paso filtra con los ids que dejaron los
 * anteriores. El borrado en local recorre la lista al revés.
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
  // Del usuario
  {
    table: 'public.user_documents',
    where: { sql: 'user_id = ANY($1::uuid[])', key: 'userIds' },
  },
  {
    table: 'public.notifications',
    where: { sql: 'user_id = ANY($1::uuid[])', key: 'userIds' },
  },
  // Solicitudes y lo que cuelga de cada una
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
  // Catálogos completos
  { table: 'public.products' },
  { table: 'public.product_variant_attributes' },
  { table: 'public.product_variant_attribute_values' },
  { table: 'public.payment_interest_rules' },
  { table: 'public.stores' },
  { table: 'public.providers' },
  { table: 'public.payment_methods' },
];
