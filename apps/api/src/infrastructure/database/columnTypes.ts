import { customType } from 'drizzle-orm/pg-core';

/**
 * `tsvector` has no native type in Drizzle.
 *
 * The application maintains the column, not a GENERATED one: the searchable
 * text includes brand and person names that live in other tables (E01·04), and
 * a generated column can only depend on its own row.
 */
export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tsvector';
  },
});

/**
 * Text search configuration. Adjust it to the content's language: the
 * configuration drives stemming and stop words.
 */
export const TEXT_SEARCH_CONFIG = 'spanish';

/**
 * Embedding dimension of Vertex AI's `multimodalembedding@001`.
 * Changing models forces recomputing every stored embedding.
 */
export const EMBEDDING_DIMENSIONS = 1408;
