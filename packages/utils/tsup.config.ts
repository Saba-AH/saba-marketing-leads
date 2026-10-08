import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  dts: true,
  sourcemap: true,
  minify: true,
  splitting: false,
  // Not cleaned in `--watch`: deleting dist/ at startup leaves `nest start
  // --watch` compiling without the package's .d.ts and the first build fails.
  clean: !options.watch,
  format: ['cjs', 'esm'],
  outDir: 'dist',
  target: ['node24'],
}));
