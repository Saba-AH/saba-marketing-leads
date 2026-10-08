import dotenv from 'dotenv';
import nextJest from 'next/jest.js';

dotenv.config({ path: '.env.local' });

const createJestConfig = nextJest({
  dir: './',
});

/**
 * Packages published as ESM only that Jest has to transform. MSW 2 pulls in
 * several; without this, `import`/`export` blow up when loading them.
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
   * Jest's 5 s fall short with modals: a form with the country catalog (99
   * options, and two blocks in the international case) plus a dozen `userEvent`
   * interactions exceeds them when Turbo runs the suites in parallel with the
   * API ones. They passed in isolation and failed in the full run — the flake
   * that kept showing up in `clienteModal`.
   */
  testTimeout: 15_000,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.(test|spec).[jt]s?(x)'],
  // The SSR build (`output: 'standalone'`) emits a nested package.json in .next/;
  // without this, jest-haste-map collides it with the workspace one.
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  // Same alias as tsconfig: `@/` is always `src/`.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFiles: ['<rootDir>/jest.polyfills.ts'],
  testEnvironmentOptions: {
    // Required by msw/node inside jsdom.
    customExportConditions: [''],
  },
};

const nextConfigFactory = createJestConfig(config);

/**
 * next/jest **prepends** its own `node_modules` pattern, so declaring
 * `transformIgnorePatterns` in the config above would have no effect: it has
 * to be replaced after next/jest builds the configuration.
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
