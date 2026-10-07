import { z } from 'zod';

/** Un `entry[].changes[]` del webhook de Meta: el campo suscrito y su `value` tal cual. */
export interface WebhookCambio {
  campo: string;
  payload: unknown;
}

// Solo la envoltura: el `value` se valida al procesarlo, porque Meta agrega
// campos sin aviso y un esquema estricto acá descartaría eventos válidos.
const webhookEnvelopeSchema = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({ field: z.string().min(1), value: z.unknown().optional() })
      ),
    })
  ),
});

/** Devuelve `[]` si el cuerpo no tiene la forma de un webhook de WhatsApp. */
export function extraerCambios(cuerpo: unknown): WebhookCambio[] {
  const parsed = webhookEnvelopeSchema.safeParse(cuerpo);
  if (!parsed.success) return [];
  return parsed.data.entry.flatMap((entry) =>
    entry.changes.map((change) => ({
      campo: change.field,
      payload: change.value ?? null,
    }))
  );
}
