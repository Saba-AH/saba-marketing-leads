import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { DependencyProbe } from '../../application/ports/out/DependencyProbe';
import type { DependencyCheck } from '../../domain/HealthReport';

/**
 * Comprueba Postgres con la consulta más barata que existe.
 *
 * No verifica `pgvector` ni tablas: eso es trabajo de las migraciones (E00·02).
 * Aquí solo interesa si la conexión está viva.
 */
@Injectable()
export class PostgresProbe implements DependencyProbe {
  readonly name = 'postgres';

  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async check(): Promise<DependencyCheck> {
    const startedAt = Date.now();
    try {
      await this.db.execute(sql`select 1`);
      return {
        name: this.name,
        status: 'up',
        latencyMs: Date.now() - startedAt,
      };
    } catch (error) {
      return {
        name: this.name,
        status: 'down',
        latencyMs: Date.now() - startedAt,
        // El mensaje de pg no lleva credenciales; la connection string nunca se
        // interpola aquí.
        detail: error instanceof Error ? error.message : 'error desconocido',
      };
    }
  }
}
