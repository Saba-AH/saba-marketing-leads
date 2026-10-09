import { z } from 'zod';

/** An `entry[].changes[]` of Meta's webhook: the subscribed field and its `value` as-is. */
export interface WebhookChange {
  field: string;
  payload: unknown;
}

// Only the envelope: `value` is validated when processing it, because Meta
// adds fields without notice and a strict schema here would drop valid events.
const webhookEnvelopeSchema = z.object({
  entry: z.array(
    z.object({
      changes: z.array(
        z.object({ field: z.string().min(1), value: z.unknown().optional() })
      ),
    })
  ),
});

/** Returns `[]` if the body does not have the shape of a WhatsApp webhook. */
export function extractChanges(body: unknown): WebhookChange[] {
  const parsed = webhookEnvelopeSchema.safeParse(body);
  if (!parsed.success) return [];
  return parsed.data.entry.flatMap((entry) =>
    entry.changes.map((change) => ({
      field: change.field,
      payload: change.value ?? null,
    }))
  );
}
