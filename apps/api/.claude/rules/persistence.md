# Persistencia

## Cliente

Inyectar con `@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb` (`ApiDb` sale de `src/infrastructure/database/drizzle.module.ts`). Es el tipo que trae el esquema cargado y habilita `db.query.<tabla>`.

## Migraciones a mano — llevan su snapshot igual

Las migraciones de este repo se escriben **a mano** cuando llevan pasos de datos que un generador no produce: deduplicar antes de crear un índice, normalizar correos, resolver una columna contra un catálogo antes de soltarla. Eso está bien y es el motivo por el que existen.

Lo que **no** puede faltar es el snapshot. `drizzle-kit` guarda en `drizzle/meta/NNNN_snapshot.json` la foto del esquema después de cada migración, y calcula el diff siguiente **contra la última foto, no contra la base**. Una migración escrita a mano sin regenerar el snapshot deja esa foto mintiendo.

El síntoma llega tarde y disfrazado: la próxima vez que alguien corra `db:generate`, la herramienta ve diferencias que no existen y propone recrear índices que ya están, o borrar y recrear una columna con datos adentro. Pasó entre la `0005` y la `0007` (#151) y nadie lo notó durante semanas, porque **aplicar** migraciones usa `meta/_journal.json` —que estaba sano— y solo **generar** usa los snapshots.

Después de escribir una migración a mano, correr `npm -C apps/api run db:generate` (necesita una terminal interactiva), vaciar el `.sql` que proponga —lo que describe ya está aplicado— y quedarse con el snapshot.

**No se toca el `when` de una entrada del journal que ya se aplicó en algún lado.** El migrador decide qué correr comparando ese timestamp con el de la última migración registrada en la base: cambiarlo hace que una migración ya aplicada vuelva a ejecutarse, y un `CREATE INDEX` repetido falla con `42P07`. Si pasa en la base de tests, se suelta (`DROP DATABASE app_dev_test`) y la suite la rehace sola.

## Agregador de esquema — se olvida y explota en runtime

Cada `*.schema.ts` nuevo bajo `src/modules/**/infrastructure/persistence/`, cada bloque `relations()` y cada `pgEnum` **se reexporta desde `src/infrastructure/database/db-schema.ts` en el mismo PR**.

El cliente lo lee una sola vez al inicializar. Si falta una entrada, compila igual y falla la primera vez que alguien consulta esa tabla por relación:

```
Cannot read properties of undefined (reading 'referencedTable')
```

No hay guarda en tiempo de compilación. Los joins manuales (`db.select().from(x).innerJoin(y, …)`) importan las tablas directo del `.schema.ts` y no dependen del agregador — razón de más para no olvidarlo, porque el síntoma aparece recién con el primer `db.query`.

## Traer datos relacionados: relaciones, no más queries

**Aprovechar el ORM.** Para datos relacionados va la API relacional de Drizzle, que resuelve todo en **una ida a la base**:

```typescript
// Rol con sus permisos, en una consulta
const role = await this.db.query.roles.findFirst({
  where: eq(roles.id, roleId),
  with: { permissions: true },
});
```

Reglas:

- **Prohibido el N+1.** Un `await` dentro de un `for`/`map` sobre resultados es la señal. Se resuelve con `with`, o con un `inArray(tabla.id, ids)` y agrupando en memoria.
- **`with` exige `relations()` declaradas** y reexportadas en el agregador. Es el único motivo por el que existe esa regla.
- **Anida por fan-out, no por profundidad.** No hay techo de niveles. Las relaciones *to-one* son casi gratis a cualquier profundidad: no multiplican filas. Lo que cuesta son las *to-many* anidadas, porque el costo es el **producto** de los fan-out. `usuario → rol → permisos` es barato aunque tenga tres saltos; `entidad → hijos → nietos` sobre 200 entidades materializa decenas de miles de filas en JSON. Cuando ese producto se dispara: `limit` en la relación anidada si basta una muestra, o partir la consulta, o join explícito con agregado. Ante la duda, `EXPLAIN ANALYZE` sobre datos de verdad — no se decide de memoria.
- **Para contar o agregar no se usa `with`.** `with` trae filas; un `count()`/`sum()` va con join explícito y `groupBy`.
- **Traer solo las columnas necesarias** (`columns: { id: true, name: true }`). Un `select *` sobre una tabla con embeddings arrastra el vector — cientos de floats por fila.

Objetivo: **la menor cantidad de queries que deje el código claro.** Si un caso de uso necesita tres consultas porque son tres agregados distintos, tres está bien; lo que no está bien es una por fila.

## Transacciones — obligatorias cuando se escribe en varios sitios

**Todo caso de uso que cree o actualice más de una tabla, o más de un registro que deba quedar consistente entre sí, corre dentro de una sola transacción.** Si el segundo write falla, el primero se revierte. No se aceptan escrituras parciales: dejan datos inconsistentes que después nadie sabe reparar.

Ejemplos: un registro padre y sus hijos que deben crearse juntos, un usuario con sus overrides de permisos, aprobar un lote y publicar sus elementos.

La transacción vive **en el caso de uso**, no en el adaptador, porque es el caso de uso el que sabe qué tiene que ser atómico. Para que la capa de aplicación no importe Drizzle, se inyecta un puerto de unidad de trabajo que entrega los repositorios ya ligados a la transacción:

```typescript
// application/ports/out/ResourceUnitOfWork.ts
export interface ResourceTxScope {
  resources: ResourceRepositoryPort;
  details: DetailRepositoryPort;
}

export interface ResourceUnitOfWork {
  run<T>(work: (scope: ResourceTxScope) => Promise<T>): Promise<T>;
}
```

```typescript
// infrastructure/persistence/DrizzleResourceUnitOfWork.ts
@Injectable()
export class DrizzleResourceUnitOfWork implements ResourceUnitOfWork {
  constructor(@Inject(DRIZZLE_CLIENT) private readonly db: ApiDb) {}

  async run<T>(work: (scope: ResourceTxScope) => Promise<T>): Promise<T> {
    return this.db.transaction(async (tx) =>
      work({
        resources: new DrizzleResourceRepository(tx),
        details: new DrizzleDetailRepository(tx),
      })
    );
  }
}
```

```typescript
// application/use-cases/RegisterResourceUseCase.ts
const resource = await this.uow.run(async ({ resources, details }) => {
  const created = await resources.insert(newResource);
  await details.insertMany(created.id, values);
  return created;
});
```

Reglas dentro de una transacción:

- **Cero I/O externo.** Nada de Vertex AI, Cloud Storage, signed URLs, correo ni HTTP dentro del bloque. Primero se calcula, después se abre la transacción. Una llamada lenta retiene la conexión del pool, y un rollback no des-envía un correo.
- **Lanzar para revertir.** Drizzle hace rollback ante cualquier excepción. Nunca atrapar y seguir dentro del callback: eso confirma la transacción con datos a medias.
- **Corta.** Se envuelven los writes, no la petición entera.
- **Leer lo que se acaba de escribir va por los repositorios del scope**, no por los inyectados en el constructor: esos usan otra conexión y no ven la transacción abierta.
- **No anidar sin motivo.** Drizzle traduce transacciones anidadas a savepoints; solo tiene sentido si de verdad se quiere revertir una parte.
- **La transacción no reemplaza la idempotencia.** Un worker que procesa eventos puede recibir el mismo evento dos veces: eso se resuelve con una clave de idempotencia, no con atomicidad.

Cuando todos los writes son de una sola tabla, no hace falta ceremonia: el repositorio los hace y ya.

**Excepción: un único agregado.** Si las tablas son la raíz y las colecciones hijas de un mismo agregado — nadie fuera del repositorio del agregado las consulta ni las expone como repositorio propio (p. ej. Unidad con sus Posiciones y Alias de Entra, `modules/estructura`) —, la transacción puede vivir directamente en el método del repositorio de ese agregado (`this.db.transaction(...)` dentro de `crear`/`actualizar`), sin un Unit-of-Work de por medio. El UoW de arriba es para cuando el **caso de uso** coordina repositorios de agregados independientes que decide combinar; acá la atomicidad es intrínseca a cómo se persiste un solo agregado, no una decisión de negocio del caso de uso.

## Escalera de consulta: se baja un escalón solo cuando el anterior no alcanza

En ese orden, siempre. Bajar un escalón es una decisión, no una preferencia.

**1. `db.query` con `with`** — lo normal para leer datos relacionados. Cubre la gran mayoría de las lecturas de la app.

**2. Query builder con joins explícitos** — cuando `with` no lo expresa: agregados (`count`, `sum`, `avg`), `groupBy`, `having`, `distinct on`, filtros compuestos dinámicamente, o cuando hace falta controlar el join para no traer filas de más. Sigue siendo tipado y componible; no hay razón para saltarse este escalón.

```typescript
const porCategoria = await this.db
  .select({ categoryId: resources.categoryId, total: count() })
  .from(resources)
  .where(eq(resources.status, 'published'))
  .groupBy(resources.categoryId);
```

**3. SQL cruda con el template `sql`** — solo lo que ninguno de los dos anteriores puede expresar.

## SQL cruda — permitida y acotada

**Casos legítimos:** una búsqueda híbrida (coseno exacto con `<=>` sobre el universo prefiltrado, `ts_rank`/`ts_headline` en español, fusión RRF con funciones de ventana, CTEs, paginación estable) y algunos agregados de dashboard. Eso no sale del builder.

Reglas:

- Solo en `infrastructure/persistence/`. Nunca en `domain/` ni en `application/`.
- Siempre con el template `sql` de Drizzle, que parametriza: `sql\`… where id = ${id}\``. **Jamás interpolando strings** — es inyección SQL.
- Toda consulta cruda lleva test contra el Postgres local, no contra un doble. Es el único modo de saber que el SQL es correcto.
- **Un comentario que diga qué escalón falló** y por qué. "Fusión RRF: `with` no expresa funciones de ventana" es revisable; SQL cruda sin explicación es sospechosa por defecto y en review se pide devolverla al builder.

> Divergencia consciente respecto al CLAUDE.md de origen, que decía *"No raw SQL"*. Con `pgvector` y fusión RRF esa regla haría imposible una búsqueda híbrida.
