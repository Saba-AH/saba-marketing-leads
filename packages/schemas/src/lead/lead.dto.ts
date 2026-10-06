import { z } from 'zod';
import { LIMITES, maximo } from '../limites';
import { buildSafeResponseSchema } from '../utils';

/**
 * Lead de marketing: un contacto interesado que llega por algún canal.
 * Módulo de referencia del template — recorre schema → API → BD → cliente.
 */
export const leadSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  correo: z.string(),
  /** Canal por el que llegó (formulario web, referido, evento…). */
  origen: z.string().nullable(),
  createdAt: z.string(),
});
export type TLead = z.infer<typeof leadSchema>;

export const leadResponseSchema = buildSafeResponseSchema(leadSchema);
export type TLeadResponse = z.infer<typeof leadResponseSchema>;

export const leadsResponseSchema = buildSafeResponseSchema(z.array(leadSchema));
export type TLeadsResponse = z.infer<typeof leadsResponseSchema>;

/** Body de `POST /leads`. */
export const crearLeadSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, 'El nombre es obligatorio.')
    .max(LIMITES.nombre, maximo('El nombre', LIMITES.nombre)),
  correo: z
    .email('El correo no es válido.')
    .max(LIMITES.correo, maximo('El correo', LIMITES.correo))
    // El índice único compara texto exacto: normalizar acá evita que
    // `Ana@x.com` y `ana@x.com` cuenten como dos leads distintos.
    .transform((correo) => correo.toLowerCase()),
  origen: z
    .string()
    .trim()
    .max(LIMITES.etiqueta, maximo('El origen', LIMITES.etiqueta))
    .optional(),
});
export type TCrearLead = z.infer<typeof crearLeadSchema>;
