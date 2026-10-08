import { Global, Module } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { resolveDatabaseUrl } from './databaseUrl';
import * as schema from './db-schema';

export const DRIZZLE_CLIENT = Symbol('DRIZZLE_CLIENT');

/**
 * The Drizzle client with the schema loaded. Inject with this type, not with
 * a bare `NodePgDatabase`: it is what provides `db.query.<table>` and `with`.
 */
export type ApiDb = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE_CLIENT,
      useFactory: async (): Promise<ApiDb> => {
        // The pool opens cold: if Postgres is not up, the API still starts and the
        // health check reports the dependency as down.
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
