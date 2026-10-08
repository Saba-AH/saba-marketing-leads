import { Inject, Injectable } from '@nestjs/common';
import { z } from 'zod';
import type { SabaClientesReaderPort } from '../../application/ports/SabaClientesReaderPort';
import type { ClienteSaba } from '../../domain/ClienteSaba';
import {
  SabaNoDisponibleException,
  SabaSesionNoReconocidaException,
  SabaSinPermisoException,
} from '../../domain/exceptions/sabaClientesExceptions';
import { SABA_CLIENTES_TOKENS } from '../../tokens';
import type { SabaConfig } from '../sabaConfig';

const TIMEOUT_MS = 8_000;

// Postgres `numeric` puede llegar como texto según el cliente de Saba.
const numero = z.coerce.number().nullable().catch(null);

// Contrato del servidor de Saba (en inglés): se traduce acá al dominio de este repo.
const respuestaSchema = z.object({
  ok: z.literal(true),
  customers: z.array(
    z.object({
      id: z.string(),
      fullName: z.string(),
      idNumber: z.string().nullable(),
      email: z.string().nullable(),
      phone: z.string().nullable(),
      city: z.string().nullable(),
      source: z.string().nullable(),
      customerSince: z.string().nullable(),
      applications: z.array(
        z.object({
          id: z.string(),
          status: z.string(),
          statusLabel: z.string(),
          active: z.boolean(),
          createdAt: z.string(),
          product: z.string().nullable(),
          financedAmount: numero,
          installmentAmount: numero,
          frequency: z.string().nullable(),
        })
      ),
    })
  ),
});

type ClienteDeSaba = z.infer<typeof respuestaSchema>['customers'][number];

function aClienteSaba(c: ClienteDeSaba): ClienteSaba {
  return {
    id: c.id,
    nombre: c.fullName,
    cedula: c.idNumber,
    correo: c.email,
    telefono: c.phone,
    ciudad: c.city,
    origen: c.source,
    clienteDesde: c.customerSince,
    solicitudes: c.applications.map((a) => ({
      id: a.id,
      estado: a.status,
      estadoEtiqueta: a.statusLabel,
      activa: a.active,
      creadaAt: a.createdAt,
      producto: a.product,
      montoFinanciado: a.financedAmount,
      cuota: a.installmentAmount,
      frecuencia: a.frequency,
    })),
  };
}

@Injectable()
export class HttpSabaClientesReader implements SabaClientesReaderPort {
  constructor(
    @Inject(SABA_CLIENTES_TOKENS.Config) private readonly config: SabaConfig
  ) {}

  async buscarPorTelefono(
    telefono: string,
    credencial: string
  ): Promise<ClienteSaba[]> {
    if (!this.config.apiUrl)
      throw new SabaNoDisponibleException('sin SABA_API_URL');
    const url = new URL(
      `${this.config.apiUrl}/api/admin/marketing/customers/by-phone`
    );
    url.searchParams.set('phone', telefono);

    let respuesta: Response;
    try {
      respuesta = await fetch(url, {
        headers: { Authorization: `Bearer ${credencial}` },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error: unknown) {
      throw new SabaNoDisponibleException(error);
    }

    if (respuesta.status === 401) {
      throw new SabaSesionNoReconocidaException('HTTP 401');
    }
    if (respuesta.status === 403) {
      throw new SabaSinPermisoException('HTTP 403');
    }
    if (!respuesta.ok) {
      throw new SabaNoDisponibleException(`HTTP ${respuesta.status}`);
    }
    const cuerpo = respuestaSchema.safeParse(
      await respuesta.json().catch(() => null)
    );
    if (!cuerpo.success) {
      throw new SabaNoDisponibleException('respuesta de Saba con otra forma');
    }
    return cuerpo.data.customers.map(aClienteSaba);
  }
}
