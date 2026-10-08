/**
 * Saba users that `npm run db:sync:saba` copies from prod into the local
 * Supabase, with their account, profile and applications. To bring someone
 * else, add their email here.
 *
 * The split is for validation: the sync warns if an admin has no staff role in
 * prod, or if a customer does have one.
 */
export const SYNC_USERS = {
  admins: ['angel.hernandez@sabatransporte.com'],
  customers: ['angel.hernandez+user-test@sabatransporte.com'],
} as const satisfies Record<string, readonly string[]>;

export interface SyncUsers {
  admins: readonly string[];
  customers: readonly string[];
}
