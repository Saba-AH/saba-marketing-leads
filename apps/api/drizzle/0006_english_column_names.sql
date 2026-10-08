-- Renames this repo's own tables to English (see `.claude/rules/english-naming.md`).
-- The CHECKs list the old values, so they go first and come back with the new ones
-- once the rows are translated.
ALTER TABLE "leads" RENAME COLUMN "nombre" TO "name";--> statement-breakpoint
ALTER TABLE "leads" RENAME COLUMN "correo" TO "email";--> statement-breakpoint
ALTER TABLE "leads" RENAME COLUMN "origen" TO "source";--> statement-breakpoint
ALTER TABLE "leads" RENAME CONSTRAINT "leads_correo_unique" TO "leads_email_unique";--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" DROP CONSTRAINT "whatsapp_contacts_vinculo_origen_check";--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" RENAME COLUMN "vinculo_origen" TO "link_source";--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_link_source_check" CHECK ("whatsapp_contacts"."link_source" IN ('auto', 'manual'));--> statement-breakpoint
ALTER TABLE "whatsapp_contacts" RENAME CONSTRAINT "whatsapp_contacts_identidad_check" TO "whatsapp_contacts_identity_check";--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" DROP CONSTRAINT "whatsapp_conversations_estado_check";--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "estado" TO "status";--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "tomada_por" TO "assigned_to";--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "tomada_at" TO "assigned_at";--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "ultimo_mensaje_at" TO "last_message_at";--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "ultimo_entrante_at" TO "last_inbound_at";--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "ultimo_mensaje_preview" TO "last_message_preview";--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "no_leidos" TO "unread_count";--> statement-breakpoint
UPDATE "whatsapp_conversations" SET "status" = CASE "status" WHEN 'abierta' THEN 'open' WHEN 'resuelta' THEN 'resolved' ELSE "status" END;--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ALTER COLUMN "status" SET DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_status_check" CHECK ("whatsapp_conversations"."status" IN ('open', 'resolved'));--> statement-breakpoint
ALTER INDEX "whatsapp_conversations_estado_ultimo_mensaje_idx" RENAME TO "whatsapp_conversations_status_last_message_idx";--> statement-breakpoint
ALTER INDEX "whatsapp_conversations_tomada_por_idx" RENAME TO "whatsapp_conversations_assigned_to_idx";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "whatsapp_messages_direccion_check";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "whatsapp_messages_origen_check";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "whatsapp_messages_estado_check";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "whatsapp_messages_plantilla_check";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "direccion" TO "direction";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "origen" TO "source";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "tipo" TO "type";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "cuerpo" TO "body";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "enviado_por" TO "sent_by";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "estado" TO "status";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "error_codigo" TO "error_code";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "error_detalle" TO "error_detail";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "plantilla_nombre" TO "template_name";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "plantilla_idioma" TO "template_language";--> statement-breakpoint
ALTER TABLE "whatsapp_messages" RENAME COLUMN "plantilla_categoria" TO "template_category";--> statement-breakpoint
UPDATE "whatsapp_messages" SET
  "direction" = CASE "direction" WHEN 'entrante' THEN 'inbound' WHEN 'saliente' THEN 'outbound' ELSE "direction" END,
  "source" = CASE "source" WHEN 'cliente' THEN 'customer' WHEN 'sistema' THEN 'system' WHEN 'celular' THEN 'phone' WHEN 'historial' THEN 'history' ELSE "source" END,
  "status" = CASE "status" WHEN 'pendiente' THEN 'pending' WHEN 'enviado' THEN 'sent' WHEN 'entregado' THEN 'delivered' WHEN 'leido' THEN 'read' WHEN 'fallido' THEN 'failed' ELSE "status" END;--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_direction_check" CHECK ("whatsapp_messages"."direction" IN ('inbound', 'outbound'));--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_source_check" CHECK ("whatsapp_messages"."source" IN ('customer', 'system', 'phone', 'history'));--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_status_check" CHECK ("whatsapp_messages"."status" IN ('pending', 'sent', 'delivered', 'read', 'failed'));--> statement-breakpoint
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_template_check" CHECK ("whatsapp_messages"."type" <> 'template' OR ("whatsapp_messages"."template_name" IS NOT NULL AND "whatsapp_messages"."template_language" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" RENAME COLUMN "campo" TO "field";--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" RENAME COLUMN "recibido_at" TO "received_at";--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" RENAME COLUMN "procesado_at" TO "processed_at";--> statement-breakpoint
ALTER TABLE "whatsapp_webhook_events" RENAME COLUMN "intentos" TO "attempts";--> statement-breakpoint
ALTER INDEX "whatsapp_webhook_events_pendientes_idx" RENAME TO "whatsapp_webhook_events_pending_idx";--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" DROP CONSTRAINT "whatsapp_accounts_estado_check";--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" RENAME COLUMN "estado" TO "status";--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" RENAME COLUMN "motivo_desconexion" TO "disconnect_reason";--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" RENAME COLUMN "historial_solicitado_at" TO "history_requested_at";--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" RENAME COLUMN "contactos_solicitados_at" TO "contacts_requested_at";--> statement-breakpoint
UPDATE "whatsapp_accounts" SET "status" = CASE "status" WHEN 'conectado' THEN 'connected' WHEN 'desconectado' THEN 'disconnected' ELSE "status" END;--> statement-breakpoint
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_status_check" CHECK ("whatsapp_accounts"."status" IN ('connected', 'disconnected'));
