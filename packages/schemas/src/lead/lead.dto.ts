import { z } from 'zod';
import { LENGTH_LIMITS, maxLengthMessage } from '../lengthLimits';
import { buildSafeResponseSchema } from '../utils';

/**
 * Marketing lead: an interested contact arriving through some channel.
 * The template's reference module — walks schema → API → DB → client.
 */
export const leadSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  /** Channel it arrived through (web form, referral, event…). */
  source: z.string().nullable(),
  createdAt: z.string(),
});
export type TLead = z.infer<typeof leadSchema>;

export const leadResponseSchema = buildSafeResponseSchema(leadSchema);
export type TLeadResponse = z.infer<typeof leadResponseSchema>;

export const leadsResponseSchema = buildSafeResponseSchema(z.array(leadSchema));
export type TLeadsResponse = z.infer<typeof leadsResponseSchema>;

/** Body of `POST /leads`. */
export const createLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(LENGTH_LIMITS.name, maxLengthMessage('El nombre', LENGTH_LIMITS.name)),
  email: z
    .email('El correo no es válido.')
    .max(
      LENGTH_LIMITS.email,
      maxLengthMessage('El correo', LENGTH_LIMITS.email)
    )
    // The unique index compares exact text: normalizing here keeps `Ana@x.com` and
    // `ana@x.com` from counting as two different leads.
    .transform((email) => email.toLowerCase()),
  source: z
    .string()
    .trim()
    .max(
      LENGTH_LIMITS.label,
      maxLengthMessage('El origen', LENGTH_LIMITS.label)
    )
    .optional(),
});
export type TCreateLead = z.infer<typeof createLeadSchema>;
