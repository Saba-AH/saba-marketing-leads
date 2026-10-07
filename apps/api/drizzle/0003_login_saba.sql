-- Tablas del login de staff de Saba (`saba/services/auth/portalLogin.js`), que
-- ya viven en Supabase. Se crean solo si no existen (stack local y base de
-- tests); en Supabase todo el bloque es un no-op: ni índices ni FKs nuevos
-- sobre las tablas reales.
--
-- No hay DDL de estas tablas en el repo de Saba: las columnas salen de cómo
-- las lee y escribe `portalLogin.js`.
DO $$
BEGIN
  IF to_regclass('public.login_attempts') IS NULL THEN
    CREATE TABLE public.login_attempts (
      id uuid NOT NULL DEFAULT gen_random_uuid(),
      portal text NOT NULL CHECK (portal = ANY (ARRAY['client'::text, 'admin'::text])),
      email text,
      user_id uuid,
      ip text,
      user_agent text,
      success boolean NOT NULL,
      reason text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT login_attempts_pkey PRIMARY KEY (id)
    );
    -- Las dos consultas del rate limit: fallos recientes por IP y por correo.
    CREATE INDEX login_attempts_portal_ip_created_at_idx
      ON public.login_attempts (portal, ip, created_at DESC);
    CREATE INDEX login_attempts_portal_email_created_at_idx
      ON public.login_attempts (portal, email, created_at DESC);
  END IF;

  IF to_regclass('public.admin_login_lockouts') IS NULL THEN
    CREATE TABLE public.admin_login_lockouts (
      user_id uuid NOT NULL,
      email text,
      failed_count integer NOT NULL DEFAULT 0,
      locked_at timestamp with time zone,
      unlocked_at timestamp with time zone,
      unlocked_by uuid,
      updated_at timestamp with time zone NOT NULL DEFAULT now(),
      CONSTRAINT admin_login_lockouts_pkey PRIMARY KEY (user_id)
    );
    -- Igual que en 0002: la FK hacia auth.users solo donde existe (el stack
    -- local sí, la base de tests no).
    IF to_regclass('auth.users') IS NOT NULL THEN
      ALTER TABLE public.admin_login_lockouts
        ADD CONSTRAINT admin_login_lockouts_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
