-- Tablas compartidas con el login de Saba: nunca se sueltan si tienen datos
-- (en Supabase son las reales).
DO $$
DECLARE
  tables text[] := ARRAY['login_attempts', 'admin_login_lockouts'];
  t text;
  has_rows boolean;
BEGIN
  FOREACH t IN ARRAY tables LOOP
    CONTINUE WHEN to_regclass(format('public.%I', t)) IS NULL;
    EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I)', t) INTO has_rows;
    IF has_rows THEN
      RAISE EXCEPTION '% tiene datos: no se revierte para no perderlos', t;
    END IF;
  END LOOP;

  DROP TABLE IF EXISTS public.login_attempts, public.admin_login_lockouts;
END $$;
