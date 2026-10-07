import { z } from 'zod';

/** `VAR=` en el `.env` cuenta como no definida: el `.env` trae en blanco lo que no se usa. */
function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (value) => (value === '' ? undefined : value),
    schema.optional()
  );
}

const whatsappEnvSchema = z.object({
  WHATSAPP_APP_SECRET: optional(z.string().min(1)),
  WHATSAPP_VERIFY_TOKEN: optional(z.string().min(1)),
});

export interface WhatsAppConfig {
  appSecret: string | null;
  verifyToken: string | null;
}

/**
 * A diferencia de auth, no falla al arrancar: la API sirve el resto del panel
 * aunque WhatsApp no esté configurado, y el webhook rechaza todo hasta que lo esté.
 */
export function loadWhatsAppConfig(
  env: NodeJS.ProcessEnv = process.env
): WhatsAppConfig {
  const parsed = whatsappEnvSchema.parse(env);
  return {
    appSecret: parsed.WHATSAPP_APP_SECRET ?? null,
    verifyToken: parsed.WHATSAPP_VERIFY_TOKEN ?? null,
  };
}
