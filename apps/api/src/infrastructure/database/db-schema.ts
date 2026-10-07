/**
 * Agregador de esquema de Drizzle.
 *
 * El cliente lo consulta **una sola vez, al inicializar**, y es lo único que le
 * permite resolver `db.query.<tabla>` y los `with: { relacion: true }`. Un
 * `*.schema.ts` que no esté reexportado acá compila sin problema y luego falla
 * en runtime con:
 *
 *     Cannot read properties of undefined (reading 'referencedTable')
 *
 * la primera vez que alguien lo consulta por relación. No hay guarda en tiempo
 * de compilación: la regla es que **cada `*.schema.ts` nuevo, cada `relations()`
 * y cada `pgEnum` se reexporten aquí en el mismo PR**.
 */

export * from '../../modules/leads/infrastructure/persistence/leads.schema';
export * from '../../modules/mobileAppVersions/infrastructure/persistence/mobileAppVersions.schema';
export * from '../../modules/whatsapp/infrastructure/persistence/whatsapp.schema';
