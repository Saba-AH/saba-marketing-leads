-- Volver a exigir `wa_id` dejaría huérfanos a los contactos que solo tienen
-- nombre de usuario: no se revierte si hay alguno.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "whatsapp_contacts" WHERE "wa_id" IS NULL) THEN
    RAISE EXCEPTION 'whatsapp_contacts tiene contactos sin wa_id: no se revierte para no perderlos';
  END IF;
  ALTER TABLE "whatsapp_contacts" DROP CONSTRAINT "whatsapp_contacts_identidad_check";
  ALTER TABLE "whatsapp_contacts" DROP CONSTRAINT "whatsapp_contacts_user_id_unique";
  ALTER TABLE "whatsapp_contacts" DROP COLUMN "user_id";
  ALTER TABLE "whatsapp_contacts" ALTER COLUMN "wa_id" SET NOT NULL;
END $$;
