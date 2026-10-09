import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    // Modules that talk to Saba fail at startup without their config; the tests
    // double the adapters, so these values never reach a real server.
    env: {
      SABA_API_URL: 'http://saba.test',
      SABA_SERVICE_KEY: 'test-service-key',
      // Cloudflare's test secret that always validates.
      TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA',
    },
    include: ['src/test/**/*.test.ts'],
    // Creates and migrates the test database once per run.
    globalSetup: ['src/test/support/globalSetup.ts'],
    // Integration tests truncate shared tables: in parallel they step on each other.
    fileParallelism: false,
    // Migrating a database from scratch exceeds the 5 s default on a cold start.
    hookTimeout: 60_000,
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
