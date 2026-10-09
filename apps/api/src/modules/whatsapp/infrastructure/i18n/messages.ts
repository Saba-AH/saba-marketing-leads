export const whatsappMessages = {
  WHATSAPP_CONVERSATION_NOT_FOUND: 'La conversación no existe.',
  WHATSAPP_MEDIA_UNAVAILABLE:
    'El archivo ya no está disponible en WhatsApp (Meta lo guarda unos 30 días).',
  WHATSAPP_WINDOW_CLOSED:
    'Pasaron más de 24 h desde el último mensaje del cliente. Solo se le puede escribir con una plantilla.',
  WHATSAPP_CONTACT_WITHOUT_PHONE:
    'Este contacto solo comparte su nombre de usuario de WhatsApp: todavía no se le puede responder desde el panel.',
  WHATSAPP_NOT_CONFIGURED: 'WhatsApp no está configurado en el servidor.',
  WHATSAPP_RECIPIENT_NOT_ALLOWED:
    'Este número no está en la lista de destinatarios permitidos del número de prueba (agrégalo en Meta → Configuración de la API).',
  WHATSAPP_UNDELIVERABLE:
    'No se pudo entregar: el número no tiene WhatsApp o no acepta mensajes.',
  WHATSAPP_INVALID_TOKEN:
    'El token de WhatsApp venció o es inválido. Hay que generar uno nuevo en Meta.',
  WHATSAPP_TOO_MANY_SENDS:
    'Demasiados envíos seguidos. Intenta de nuevo en unos segundos.',
  WHATSAPP_SEND_REJECTED:
    'WhatsApp rechazó el mensaje. El detalle quedó guardado en el mensaje.',
  WHATSAPP_INVALID_WEBHOOK_SIGNATURE:
    'La firma del webhook de WhatsApp no es válida.',
  WHATSAPP_INVALID_WEBHOOK_PAYLOAD:
    'El webhook de WhatsApp no tiene la forma esperada.',
  WHATSAPP_WEBHOOK_SUBSCRIPTION_REJECTED:
    'El token de verificación del webhook de WhatsApp no coincide.',
} as const;
