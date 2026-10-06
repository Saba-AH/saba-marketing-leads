import dotenv from 'dotenv';
import nextJest from 'next/jest.js';

dotenv.config({ path: '.env.local' });

const createJestConfig = nextJest({
  dir: './',
});

/**
 * Paquetes que se publican solo como ESM y que Jest tiene que transformar.
 * MSW 2 arrastra varios; sin esto, `import`/`export` explotan al cargarlos.
 */
const ESM_ONLY_PACKAGES = [
  '@repo/ui',
  'msw',
  '@mswjs',
  'until-async',
  '@bundled-es-modules',
];

const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  /**
   * Los 5 s de Jest se quedan cortos con los modales: un formulario con el
   * catálogo de países (99 opciones, y dos bloques en el caso internacional)
   * más una decena de interacciones de `userEvent` los supera cuando Turbo
   * corre las suites en paralelo con las del API. Pasaban aislados y fallaban
   * en la corrida completa — el flake que se venía viendo en `clienteModal`.
   */
  testTimeout: 15_000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)'],
  // El build SSR (`output: 'standalone'`) emite un package.json anidado en
  // .next/; sin esto, jest-haste-map lo colisiona con el del workspace.
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  // Mismo alias que tsconfig: `@/` es siempre `src/`.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/jest.polyfills.ts'],
  testEnvironmentOptions: {
    // Requerido por msw/node dentro de jsdom.
    customExportConditions: [''],
  },
};

const nextConfigFactory = createJestConfig(config);

/**
 * next/jest **antepone** su propio patrón de `node_modules`, así que declarar
 * `transformIgnorePatterns` en la config de arriba no tendría efecto: hay que
 * reemplazarlo después de que next/jest arme la configuración.
 */
export default async function jestConfig() {
  const resolved = await nextConfigFactory();

  return {
    ...resolved,
    transformIgnorePatterns: [
      `/node_modules/(?!(?:\\.pnpm/)?(?:${ESM_ONLY_PACKAGES.join('|')})/)`,
      ...(resolved.transformIgnorePatterns ?? []).filter(
        (pattern: string) => !pattern.startsWith('/node_modules/')
      ),
    ],
  };
}
