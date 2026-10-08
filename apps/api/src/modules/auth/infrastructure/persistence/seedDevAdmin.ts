import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Development admin to be able to log in against the local Supabase stack.
 * Trivial password on purpose: it only exists locally, and
 * `assertLocalDatabase` (in `scripts/seed.ts`) prevents seeding it elsewhere.
 */
export const DEV_ADMIN = {
  id: 'de000000-0000-0000-0000-000000000001',
  email: 'angel.hernandez@sabatransporte.com',
  password: '12345678',
  name: 'Angel',
  lastName: 'Hernández',
} as const;

/**
 * Idempotent: running it again duplicates nothing and does not change the
 * password. If the email already belongs to another user (the prod one, brought
 * by `npm run db:sync:saba`), it does nothing: that one wins.
 *
 * @returns whether it seeded (or already had) the development admin.
 *
 * Raw SQL: `auth.*` belongs to GoTrue and `profiles` to Saba; neither has a
 * `*.schema.ts` in this repo, so the builder does not know them.
 */
export async function seedDevAdmin(
  db: NodePgDatabase<Record<string, unknown>>
): Promise<boolean> {
  const { rows } = await db.execute<{ id: string }>(sql`
    SELECT id::text FROM auth.users WHERE lower(email) = lower(${DEV_ADMIN.email})
  `);
  if (rows.some((row) => row.id !== DEV_ADMIN.id)) return false;

  await db.transaction(async (tx) => {
    // GoTrue scans the token columns as strings: NULL breaks the login.
    await tx.execute(sql`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email,
        encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        confirmation_token, recovery_token,
        email_change_token_new, email_change_token_current,
        email_change, phone_change_token, reauthentication_token
      )
      VALUES (
        '00000000-0000-0000-0000-000000000000', ${DEV_ADMIN.id},
        'authenticated', 'authenticated', ${DEV_ADMIN.email},
        extensions.crypt(${DEV_ADMIN.password}, extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}', '{}',
        now(), now(),
        '', '', '', '', '', '', ''
      )
      ON CONFLICT (id) DO NOTHING
    `);

    // GoTrue v2 looks up the email identity by `provider_id = email`.
    await tx.execute(sql`
      INSERT INTO auth.identities (
        id, user_id, provider_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at
      )
      VALUES (
        ${DEV_ADMIN.id}, ${DEV_ADMIN.id}, ${DEV_ADMIN.email},
        jsonb_build_object('sub', ${DEV_ADMIN.id}::text, 'email', ${DEV_ADMIN.email}::text),
        'email', now(), now(), now()
      )
      ON CONFLICT (provider, provider_id) DO NOTHING
    `);

    await tx.execute(sql`
      INSERT INTO public.profiles (id, nombre, apellido, email, role)
      VALUES (
        ${DEV_ADMIN.id}, ${DEV_ADMIN.name}, ${DEV_ADMIN.lastName},
        ${DEV_ADMIN.email}, 'admin'
      )
      ON CONFLICT (id) DO UPDATE SET role = 'admin'
    `);
  });
  return true;
}
