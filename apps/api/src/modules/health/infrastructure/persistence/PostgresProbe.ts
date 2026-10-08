import { Inject, Injectable } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import {
  type ApiDb,
  DRIZZLE_CLIENT,
} from '../../../../infrastructure/database/drizzle.module';
import type { DependencyProbe } from '../../application/ports/out/DependencyProbe';
import type { DependencyCheck } from '../../domain/HealthReport';

/**
 * Checks Postgres with the cheapest query there is.
 *
 * It does not verify `pgvector` or tables: that is the migrations' job
 * (E00·02). Here we only care whether the connection is alive.
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
        // pg's message carries no credentials; the connection string is never
        // interpolated here.
        detail: error instanceof Error ? error.message : 'error desconocido',
      };
    }
  }
}
