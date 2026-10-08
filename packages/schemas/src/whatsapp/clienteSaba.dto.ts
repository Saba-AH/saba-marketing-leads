import { z } from 'zod';
import { buildSafeResponseSchema } from '../utils';

/** Solicitud de un cliente, como la resume el servidor de Saba (`/admin/marketing/customers`). */
export const solicitudSabaSchema = z.object({
  id: z.string(),
  estado: z.string(),
  /** En texto legible ("Cita agendada"), no el código interno. */
  estadoEtiqueta: z.string(),
  activa: z.boolean(),
  creadaAt: z.string(),
  producto: z.string().nullable(),
  montoFinanciado: z.number().nullable(),
  cuota: z.number().nullable(),
  frecuencia: z.string().nullable(),
});
export type TSolicitudSaba = z.infer<typeof solicitudSabaSchema>;

export const clienteSabaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  cedula: z.string().nullable(),
  correo: z.string().nullable(),
  telefono: z.string().nullable(),
  ciudad: z.string().nullable(),
  origen: z.string().nullable(),
  clienteDesde: z.string().nullable(),
  solicitudes: z.array(solicitudSabaSchema),
});
export type TClienteSaba = z.infer<typeof clienteSabaSchema>;

export const clienteSabaChatSchema = z.object({
  /** El contacto solo comparte su nombre de usuario de WhatsApp: no hay con qué buscar. */
  sinTelefono: z.boolean(),
  /** Perfiles de Saba con ese teléfono, el más probable primero (máx. 5). */
  clientes: z.array(clienteSabaSchema),
});
export type TClienteSabaChat = z.infer<typeof clienteSabaChatSchema>;

export const clienteSabaChatResponseSchema = buildSafeResponseSchema(
  clienteSabaChatSchema
);
export type TClienteSabaChatResponse = z.infer<
  typeof clienteSabaChatResponseSchema
>;
