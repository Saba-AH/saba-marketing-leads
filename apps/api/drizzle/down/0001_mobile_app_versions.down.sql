-- La tabla puede ser la de Supabase, anterior a este repo: nunca se suelta con
-- datos adentro. Para un reset local con filas: `npm run db:reset` (recrea el
-- volumen) en vez de `db:rollback`.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "mobile_app_versions") THEN
    RAISE EXCEPTION 'mobile_app_versions tiene datos: no se revierte para no perderlos';
  END IF;
  DROP TABLE "mobile_app_versions";
END $$;
