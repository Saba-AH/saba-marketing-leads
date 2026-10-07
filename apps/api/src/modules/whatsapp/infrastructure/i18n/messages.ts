export const whatsappMessages = {
  WHATSAPP_CONVERSACION_NO_ENCONTRADA: 'La conversación no existe.',
  WHATSAPP_VENTANA_CERRADA:
    'Pasaron más de 24 h desde el último mensaje del cliente. Solo se le puede escribir con una plantilla.',
  WHATSAPP_CONTACTO_SIN_TELEFONO:
    'Este contacto solo comparte su nombre de usuario de WhatsApp: todavía no se le puede responder desde el panel.',
  WHATSAPP_NO_CONFIGURADO: 'WhatsApp no está configurado en el servidor.',
  WHATSAPP_DESTINATARIO_NO_PERMITIDO:
    'Este número no está en la lista de destinatarios permitidos del número de prueba (agrégalo en Meta → Configuración de la API).',
  WHATSAPP_NO_ENTREGABLE:
    'No se pudo entregar: el número no tiene WhatsApp o no acepta mensajes.',
  WHATSAPP_TOKEN_INVALIDO:
    'El token de WhatsApp venció o es inválido. Hay que generar uno nuevo en Meta.',
  WHATSAPP_DEMASIADOS_ENVIOS:
    'Demasiados envíos seguidos. Intenta de nuevo en unos segundos.',
  WHATSAPP_ENVIO_RECHAZADO:
    'WhatsApp rechazó el mensaje. El detalle quedó guardado en el mensaje.',
  WHATSAPP_FIRMA_WEBHOOK_INVALIDA:
    'La firma del webhook de WhatsApp no es válida.',
  WHATSAPP_PAYLOAD_WEBHOOK_INVALIDO:
    'El webhook de WhatsApp no tiene la forma esperada.',
  WHATSAPP_SUSCRIPCION_WEBHOOK_RECHAZADA:
    'El token de verificación del webhook de WhatsApp no coincide.',
} as const;
