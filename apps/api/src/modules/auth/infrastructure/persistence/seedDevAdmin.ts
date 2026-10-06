import { sql } from 'drizzle-orm';
import { isLocalDatabaseUrl } from '../../../../infrastructure/database/databaseUrl';
import type { ApiDb } from '../../../../infrastructure/database/drizzle.module';

/**
 * Admin de desarrollo para poder iniciar sesión contra el stack local de
 * Supabase. Contraseña trivial a propósito: solo existe en local, y
 * `assertLocalDatabase` impide sembrarlo en cualquier otra base.
 */
export const DEV_ADMIN = {
  id: 'de000000-0000-0000-0000-000000000001',
  email: 'angel.hernandez@sabatransporte.com',
  password: '12345678',
  nombre: 'Angel',
  apellido: 'Hernández',
} as const;

export function assertLocalDatabase(url: string): void {
  if (!isLocalDatabaseUrl(url)) {
    throw new Error(
      `el admin de desarrollo solo se siembra en una base local (host: ${new URL(url).hostname})`
    );
  }
}

/**
 * Idempotente: correrlo de nuevo no duplica nada ni cambia la contraseña.
 *
 * SQL cruda: `auth.*` es de GoTrue y `profiles` de Saba; ninguna tiene
 * `*.schema.ts` en este repo, así que el builder no las conoce.
 */
export async function seedDevAdmin(db: ApiDb): Promise<void> {
  await db.transaction(async (tx) => {
    // GoTrue escanea las columnas de tokens como string: NULL rompe el login.
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

    // GoTrue v2 busca la identidad de email por `provider_id = email`.
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
        ${DEV_ADMIN.id}, ${DEV_ADMIN.nombre}, ${DEV_ADMIN.apellido},
        ${DEV_ADMIN.email}, 'admin'
      )
      ON CONFLICT (id) DO UPDATE SET role = 'admin'
    `);
  });
}
