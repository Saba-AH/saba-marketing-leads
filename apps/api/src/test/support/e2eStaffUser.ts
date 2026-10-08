import type { Pool } from 'pg';

/**
 * The auth e2e's own user, in the local stack's database. It does not depend
 * on the seed admin: that one may have been replaced by the prod one
 * (`npm run db:sync:saba`), with another password.
 */
export const E2E_STAFF = {
  id: 'e2e00000-0000-0000-0000-000000000001',
  email: 'e2e-auth@saba-marketing-leads.test',
  password: 'e2e-long-password',
  name: 'E2E',
  lastName: 'Auth',
} as const;

/** Emails the e2e writes to `login_attempts` with. */
export const E2E_LOGIN_EMAILS = [E2E_STAFF.email, 'nadie@ejemplo.com'];

export async function createE2EStaff(pool: Pool): Promise<void> {
  await removeE2EStaff(pool);
  const { id, email, password, name, lastName } = E2E_STAFF;
  // Token columns as '' and not NULL: GoTrue scans them as strings.
  await pool.query(
    `INSERT INTO auth.users (
       instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
       confirmation_token, recovery_token, email_change_token_new,
       email_change_token_current, email_change, phone_change_token, reauthentication_token
     ) VALUES (
       '00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2,
       extensions.crypt($3, extensions.gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{}', now(), now(),
       '', '', '', '', '', '', ''
     )`,
    [id, email, password]
  );
  await pool.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, created_at, updated_at)
     VALUES ($1::uuid, $1::uuid, $2::text,
             jsonb_build_object('sub', $1::uuid::text, 'email', $2::text), 'email', now(), now())`,
    [id, email]
  );
  await pool.query(
    `INSERT INTO public.profiles (id, nombre, apellido, email, role)
     VALUES ($1, $2, $3, $4, 'admin')`,
    [id, name, lastName, email]
  );
}

export async function removeE2EStaff(pool: Pool): Promise<void> {
  const { id } = E2E_STAFF;
  await pool.query('DELETE FROM auth.refresh_tokens WHERE user_id = $1::text', [
    id,
  ]);
  await pool.query('DELETE FROM auth.sessions WHERE user_id = $1', [id]);
  await pool.query(
    'DELETE FROM public.admin_login_lockouts WHERE user_id = $1',
    [id]
  );
  await pool.query('DELETE FROM public.profiles WHERE id = $1', [id]);
  await pool.query('DELETE FROM auth.identities WHERE user_id = $1', [id]);
  await pool.query('DELETE FROM auth.users WHERE id = $1', [id]);
  // Without this, every run adds per-IP failures until it hits the rate limit.
  await pool.query('DELETE FROM public.login_attempts WHERE email = ANY($1)', [
    E2E_LOGIN_EMAILS,
  ]);
}
