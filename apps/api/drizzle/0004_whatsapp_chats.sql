CREATE TABLE "whatsapp_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waba_id" text NOT NULL,
	"phone_number_id" text NOT NULL,
	"display_phone" text,
	"estado" text NOT NULL,
	"motivo_desconexion" text,
	"historial_solicitado_at" timestamp with time zone,
	"contactos_solicitados_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_accounts_phone_number_id_unique" UNIQUE("phone_number_id"),
	CONSTRAINT "whatsapp_accounts_estado_check" CHECK ("whatsapp_accounts"."estado" IN ('conectado', 'desconectado'))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wa_id" text NOT NULL,
	"profile_name" text,
	"saba_profile_id" uuid,
	"vinculo_origen" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_contacts_wa_id_unique" UNIQUE("wa_id"),
	CONSTRAINT "whatsapp_contacts_vinculo_origen_check" CHECK ("whatsapp_contacts"."vinculo_origen" IN ('auto', 'manual'))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contact_id" uuid NOT NULL,
	"estado" text DEFAULT 'abierta' NOT NULL,
	"tomada_por" uuid,
	"tomada_at" timestamp with time zone,
	"ultimo_mensaje_at" timestamp with time zone,
	"ultimo_entrante_at" timestamp with time zone,
	"ultimo_mensaje_preview" text,
	"no_leidos" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_conversations_contact_id_unique" UNIQUE("contact_id"),
	CONSTRAINT "whatsapp_conversations_estado_check" CHECK ("whatsapp_conversations"."estado" IN ('abierta', 'resuelta'))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"wamid" text,
	"direccion" text NOT NULL,
	"origen" text NOT NULL,
	"tipo" text NOT NULL,
	"cuerpo" text,
	"media_id" text,
	"enviado_por" uuid,
	"estado" text,
	"error_codigo" text,
	"error_detalle" text,
	"plantilla_nombre" text,
	"plantilla_idioma" text,
	"plantilla_categoria" text,
	"wa_timestamp" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "whatsapp_messages_wamid_unique" UNIQUE("wamid"),
	CONSTRAINT "whatsapp_messages_direccion_check" CHECK ("whatsapp_messages"."direccion" IN ('entrante', 'saliente')),
	CONSTRAINT "whatsapp_messages_origen_check" CHECK ("whatsapp_messages"."origen" IN ('cliente', 'sistema', 'celular', 'historial')),
	CONSTRAINT "whatsapp_messages_estado_check" CHECK ("whatsapp_messages"."estado" IN ('pendiente', 'enviado', 'entregado', 'leido', 'fallido')),
	CONSTRAINT "whatsapp_messages_plantilla_check" CHECK ("whatsapp_messages"."tipo" <> 'template' OR ("whatsapp_messages"."plantilla_nombre" IS NOT NULL AND "whatsapp_messages"."plantilla_idioma" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "whatsapp_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campo" text NOT NULL,
	"payload" jsonb NOT NULL,
	"recibido_at" timestamp with time zone DEFAULT now() NOT NULL,
	"procesado_at" timestamp with time zone,
	"intentos" integer DEFAULT 0 NOT NULL,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_contact_id_whatsapp_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."whatsapp_contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversation_id_whatsapp_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."whatsapp_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_estado_ultimo_mensaje_idx" ON "whatsapp_conversations" USING btree ("estado","ultimo_mensaje_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "whatsapp_conversations_tomada_por_idx" ON "whatsapp_conversations" USING btree ("tomada_por");--> statement-breakpoint
CREATE INDEX "whatsapp_messages_conversation_wa_timestamp_idx" ON "whatsapp_messages" USING btree ("conversation_id","wa_timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "whatsapp_webhook_events_pendientes_idx" ON "whatsapp_webhook_events" USING btree ("recibido_at") WHERE "whatsapp_webhook_events"."procesado_at" IS NULL;