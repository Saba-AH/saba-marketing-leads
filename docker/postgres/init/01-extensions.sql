-- Extensiones que la app puede necesitar en cualquier base, local o gestionada.
-- Solo corre en la primera creación del volumen; `npm run db:reset` lo vuelve a ejecutar.

-- Búsqueda semántica por embeddings.
CREATE EXTENSION IF NOT EXISTS vector;

-- Búsqueda de texto tolerante a errores de tipeo.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Generación de UUIDs.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
