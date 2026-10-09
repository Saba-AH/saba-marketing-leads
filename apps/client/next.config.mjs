import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * The client runs with **SSR**: a Next Node server packaged as `standalone`
 * output and deployed on **Cloud Run**, in its own service.
 *
 * `output: 'standalone'` emits a minimal self-contained server in
 * `.next/standalone` that the Dockerfile starts with `node server.js`, without
 * dragging the whole `node_modules` along.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: 'standalone',

  // Monorepo: make the `standalone` trace start from the repo root and not from
  // whatever Next infers from some stray lockfile.
  outputFileTracingRoot: join(HERE, '..', '..'),

  // Image optimization disabled for now. When needed, a custom loader against
  // Cloud Storage goes in; not Next's built-in optimizer.
  images: {
    unoptimized: true,
  },

  transpilePackages: ['@repo/ui'],

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
