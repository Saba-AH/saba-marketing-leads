import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * El cliente corre con **SSR**: un servidor Node de Next empaquetado
 * como salida `standalone` y desplegado en **Cloud Run**, en su propio servicio.
 *
 * `output: 'standalone'` emite un servidor mínimo autocontenido en
 * `.next/standalone` que el Dockerfile arranca con `node server.js`, sin
 * arrastrar todo `node_modules`.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'standalone',

  // Monorepo: que el trace de `standalone` parta de la raíz del repo y no de lo
  // que Next infiera de algún lockfile suelto.
  outputFileTracingRoot: join(HERE, '..', '..'),

  // Optimización de imágenes desactivada por ahora. Cuando haga falta se pone un
  // loader propio contra Cloud Storage; no el optimizador incorporado de Next.
  images: {
    unoptimized: true,
  },

  transpilePackages: ['@repo/ui'],

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
