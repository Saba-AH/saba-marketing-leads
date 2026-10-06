import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import { esViolacionDeUnicidad } from '../../../../infrastructure/database/postgresErrors';
import type { LeadRepositoryPort } from '../../application/ports/out/LeadRepositoryPort';
import { LeadCorreoDuplicadoException } from '../../domain/exceptions/LeadCorreoDuplicadoException';
import type { DatosLead, Lead } from '../../domain/Lead';
import { toLeadDomain } from './LeadMapper';
import { leads } from './leads.schema';

@Injectable()
export class DrizzleLeadRepository implements LeadRepositoryPort {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  /** Los más recientes primero: es lo que se revisa al abrir el listado. */
  async findAll(): Promise<Lead[]> {
    const filas = await this.db.query.leads.findMany({
      orderBy: desc(leads.createdAt),
    });
    return filas.map(toLeadDomain);
  }

  async findByCorreo(correo: string): Promise<Lead | null> {
    const fila = await this.db.query.leads.findFirst({
      where: eq(leads.correo, correo),
    });
    return fila ? toLeadDomain(fila) : null;
  }

  async crear(datos: DatosLead): Promise<Lead> {
    try {
      const [fila] = await this.db
        .insert(leads)
        .values({
          nombre: datos.nombre,
          correo: datos.correo,
          origen: datos.origen ?? null,
        })
        .returning();
      return toLeadDomain(fila);
    } catch (error) {
      if (esViolacionDeUnicidad(error)) {
        throw new LeadCorreoDuplicadoException(error);
      }
      throw error;
    }
  }
}
