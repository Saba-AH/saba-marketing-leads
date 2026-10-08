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

const respuestaSchema = z.object({
  ok: z.literal(true),
  clientes: z.array(
    z.object({
      id: z.string(),
      nombre: z.string(),
      cedula: z.string().nullable(),
      correo: z.string().nullable(),
      telefono: z.string().nullable(),
      ciudad: z.string().nullable(),
      origen: z.string().nullable(),
      clienteDesde: z.string().nullable(),
      solicitudes: z.array(
        z.object({
          id: z.string(),
          estado: z.string(),
          estadoEtiqueta: z.string(),
          activa: z.boolean(),
          creadaAt: z.string(),
          producto: z.string().nullable(),
          montoFinanciado: numero,
          cuota: numero,
          frecuencia: z.string().nullable(),
        })
      ),
    })
  ),
});

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
      `${this.config.apiUrl}/api/admin/marketing/clientes/por-telefono`
    );
    url.searchParams.set('telefono', telefono);

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
    return cuerpo.data.clientes;
  }
}
