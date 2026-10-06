import { customType } from 'drizzle-orm/pg-core';

/**
 * `tsvector` no tiene tipo nativo en Drizzle.
 *
 * La columna la mantiene la aplicación, no una GENERATED: el texto buscable
 * incluye nombres de marca y de persona que viven en otras tablas (E01·04), y
 * una columna generada solo puede depender de su propia fila.
 */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tsvector';
  },
});

/**
 * Configuración de búsqueda de texto. Ajústala al idioma del contenido: la
 * configuración decide el stemming y las stop words.
 */
export const TEXT_SEARCH_CONFIG = 'spanish';

/**
 * Dimensión del embedding de `multimodalembedding@001` de Vertex AI.
 * Cambiar de modelo obliga a recalcular todos los embeddings almacenados.
 */
export const EMBEDDING_DIMENSIONS = 1408;
