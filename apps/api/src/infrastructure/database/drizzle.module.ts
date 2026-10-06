import { Global, Module } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { resolveDatabaseUrl } from './databaseUrl';
import * as schema from './db-schema';

export const DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT');

/**
 * El cliente de Drizzle con el esquema cargado. Inyectar con este tipo, no con
 * `NodePgDatabase` pelado: es lo que da `db.query.<tabla>` y los `with`.
 */
export type ApiDb = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_CLIENT,
      useFactory: async (): Promise<ApiDb> => {
        // El pool se abre en frío: si Postgres no está arriba, la API igual
        // levanta y el health check reporta la dependencia caída.
        const pool = new Pool({
          connectionString: resolveDatabaseUrl(),
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE_CLIENT],
})
export class DrizzleModule {}
