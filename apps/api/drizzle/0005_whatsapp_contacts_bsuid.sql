ALTER TABLE "whatsapp_contacts" ALTER COLUMN "wa_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_user_id_unique" UNIQUE("user_id");--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_identidad_check" CHECK ("whatsapp_contacts"."wa_id" IS NOT NULL OR "whatsapp_contacts"."user_id" IS NOT NULL);