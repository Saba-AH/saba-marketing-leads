-- Back to the Spanish names and values of 0000/0004/0005.
ALTER TABLE "whatsapp_accounts" DROP CONSTRAINT "whatsapp_accounts_status_check";
UPDATE "whatsapp_accounts" SET "status" = CASE "status" WHEN 'connected' THEN 'conectado' WHEN 'disconnected' THEN 'desconectado' ELSE "status" END;
ALTER TABLE "whatsapp_accounts" RENAME COLUMN "contacts_requested_at" TO "contactos_solicitados_at";
ALTER TABLE "whatsapp_accounts" RENAME COLUMN "history_requested_at" TO "historial_solicitado_at";
ALTER TABLE "whatsapp_accounts" RENAME COLUMN "disconnect_reason" TO "motivo_desconexion";
ALTER TABLE "whatsapp_accounts" RENAME COLUMN "status" TO "estado";
ALTER TABLE "whatsapp_accounts" ADD CONSTRAINT "whatsapp_accounts_estado_check" CHECK ("whatsapp_accounts"."estado" IN ('conectado', 'desconectado'));

ALTER INDEX "whatsapp_webhook_events_pending_idx" RENAME TO "whatsapp_webhook_events_pendientes_idx";
ALTER TABLE "whatsapp_webhook_events" RENAME COLUMN "attempts" TO "intentos";
ALTER TABLE "whatsapp_webhook_events" RENAME COLUMN "processed_at" TO "procesado_at";
ALTER TABLE "whatsapp_webhook_events" RENAME COLUMN "received_at" TO "recibido_at";
ALTER TABLE "whatsapp_webhook_events" RENAME COLUMN "field" TO "campo";

ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "whatsapp_messages_template_check";
ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "whatsapp_messages_status_check";
ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "whatsapp_messages_source_check";
ALTER TABLE "whatsapp_messages" DROP CONSTRAINT "whatsapp_messages_direction_check";
UPDATE "whatsapp_messages" SET
  "direction" = CASE "direction" WHEN 'inbound' THEN 'entrante' WHEN 'outbound' THEN 'saliente' ELSE "direction" END,
  "source" = CASE "source" WHEN 'customer' THEN 'cliente' WHEN 'system' THEN 'sistema' WHEN 'phone' THEN 'celular' WHEN 'history' THEN 'historial' ELSE "source" END,
  "status" = CASE "status" WHEN 'pending' THEN 'pendiente' WHEN 'sent' THEN 'enviado' WHEN 'delivered' THEN 'entregado' WHEN 'read' THEN 'leido' WHEN 'failed' THEN 'fallido' ELSE "status" END;
ALTER TABLE "whatsapp_messages" RENAME COLUMN "template_category" TO "plantilla_categoria";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "template_language" TO "plantilla_idioma";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "template_name" TO "plantilla_nombre";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "error_detail" TO "error_detalle";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "error_code" TO "error_codigo";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "status" TO "estado";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "sent_by" TO "enviado_por";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "body" TO "cuerpo";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "type" TO "tipo";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "source" TO "origen";
ALTER TABLE "whatsapp_messages" RENAME COLUMN "direction" TO "direccion";
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_direccion_check" CHECK ("whatsapp_messages"."direccion" IN ('entrante', 'saliente'));
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_origen_check" CHECK ("whatsapp_messages"."origen" IN ('cliente', 'sistema', 'celular', 'historial'));
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_estado_check" CHECK ("whatsapp_messages"."estado" IN ('pendiente', 'enviado', 'entregado', 'leido', 'fallido'));
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_plantilla_check" CHECK ("whatsapp_messages"."tipo" <> 'template' OR ("whatsapp_messages"."plantilla_nombre" IS NOT NULL AND "whatsapp_messages"."plantilla_idioma" IS NOT NULL));

ALTER INDEX "whatsapp_conversations_assigned_to_idx" RENAME TO "whatsapp_conversations_tomada_por_idx";
ALTER INDEX "whatsapp_conversations_status_last_message_idx" RENAME TO "whatsapp_conversations_estado_ultimo_mensaje_idx";
ALTER TABLE "whatsapp_conversations" DROP CONSTRAINT "whatsapp_conversations_status_check";
UPDATE "whatsapp_conversations" SET "status" = CASE "status" WHEN 'open' THEN 'abierta' WHEN 'resolved' THEN 'resuelta' ELSE "status" END;
ALTER TABLE "whatsapp_conversations" ALTER COLUMN "status" SET DEFAULT 'abierta';
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "unread_count" TO "no_leidos";
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "last_message_preview" TO "ultimo_mensaje_preview";
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "last_inbound_at" TO "ultimo_entrante_at";
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "last_message_at" TO "ultimo_mensaje_at";
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "assigned_at" TO "tomada_at";
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "assigned_to" TO "tomada_por";
ALTER TABLE "whatsapp_conversations" RENAME COLUMN "status" TO "estado";
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_estado_check" CHECK ("whatsapp_conversations"."estado" IN ('abierta', 'resuelta'));

ALTER TABLE "whatsapp_contacts" RENAME CONSTRAINT "whatsapp_contacts_identity_check" TO "whatsapp_contacts_identidad_check";
ALTER TABLE "whatsapp_contacts" DROP CONSTRAINT "whatsapp_contacts_link_source_check";
ALTER TABLE "whatsapp_contacts" RENAME COLUMN "link_source" TO "vinculo_origen";
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_vinculo_origen_check" CHECK ("whatsapp_contacts"."vinculo_origen" IN ('auto', 'manual'));

ALTER TABLE "leads" RENAME CONSTRAINT "leads_email_unique" TO "leads_correo_unique";
ALTER TABLE "leads" RENAME COLUMN "source" TO "origen";
ALTER TABLE "leads" RENAME COLUMN "email" TO "correo";
ALTER TABLE "leads" RENAME COLUMN "name" TO "nombre";
