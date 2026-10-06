import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/test/**/*.test.ts'],
    // Crea y migra la base de tests una sola vez por corrida.
    globalSetup: ['src/test/support/globalSetup.ts'],
    // Los tests de integración truncan tablas compartidas: en paralelo se pisan.
    fileParallelism: false,
    // Migrar una base desde cero pasa del default de 5 s en un arranque en frío.
    hookTimeout: 60_000,
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
    },
  },
});
