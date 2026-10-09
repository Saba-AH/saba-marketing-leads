CREATE TABLE "leads" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waba_id" text NOT NULL,
	"phone_number_id" text NOT NULL,
	"display_phone" text,
	"status" text NOT NULL,
	"disconnect_reason" text,
	"history_requested_at" timestamp with time zone,
	"contacts_requested_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_accounts_phone_number_id_unique" UNIQUE("phone_number_id"),
	CONSTRAINT "whatsapp_accounts_status_check" CHECK ("whatsapp_accounts"."status" IN ('connected', 'disconnected'))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wa_id" text,
	"user_id" text,
	"profile_name" text,
	"saba_profile_id" uuid,
	"link_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_contacts_wa_id_unique" UNIQUE("wa_id"),
	CONSTRAINT "whatsapp_contacts_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "whatsapp_contacts_identity_check" CHECK ("whatsapp_contacts"."wa_id" IS NOT NULL OR "whatsapp_contacts"."user_id" IS NOT NULL),
	CONSTRAINT "whatsapp_contacts_link_source_check" CHECK ("whatsapp_contacts"."link_source" IN ('auto', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to" uuid,
	"assigned_at" timestamp with time zone,
	"last_message_at" timestamp with time zone,
	"last_inbound_at" timestamp with time zone,
	"last_message_preview" text,
	"unread_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_conversations_contact_id_unique" UNIQUE("contact_id"),
	CONSTRAINT "whatsapp_conversations_status_check" CHECK ("whatsapp_conversations"."status" IN ('open', 'resolved'))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"wamid" text,
	"direction" text NOT NULL,
	"source" text NOT NULL,
	"type" text NOT NULL,
	"body" text,
	"media_id" text,
	"sent_by" uuid,
	"status" text,
	"error_code" text,
	"error_detail" text,
	"template_name" text,
	"template_language" text,
	"template_category" text,
	"wa_timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_messages_wamid_unique" UNIQUE("wamid"),
	CONSTRAINT "whatsapp_messages_direction_check" CHECK ("whatsapp_messages"."direction" IN ('inbound', 'outbound')),
	CONSTRAINT "whatsapp_messages_source_check" CHECK ("whatsapp_messages"."source" IN ('customer', 'system', 'phone', 'history')),
	CONSTRAINT "whatsapp_messages_status_check" CHECK ("whatsapp_messages"."status" IN ('pending', 'sent', 'delivered', 'read', 'failed')),
	CONSTRAINT "whatsapp_messages_template_check" CHECK ("whatsapp_messages"."type" <> 'template' OR ("whatsapp_messages"."template_name" IS NOT NULL AND "whatsapp_messages"."template_language" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"field" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_contact_id_whatsapp_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."whatsapp_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_status_last_message_idx" ON "whatsapp_conversations" USING btree ("status","last_message_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_assigned_to_idx" ON "whatsapp_conversations" USING btree ("assigned_to");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_conversation_wa_timestamp_idx" ON "whatsapp_messages" USING btree ("conversation_id","wa_timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "whatsapp_webhook_events_pending_idx" ON "whatsapp_webhook_events" USING btree ("received_at") WHERE "whatsapp_webhook_events"."processed_at" IS NULL;