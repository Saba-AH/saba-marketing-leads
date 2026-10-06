import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  dts: true,
  sourcemap: true,
  minify: true,
  splitting: false,
  // En `--watch` no se limpia: borrar dist/ al arrancar deja a `nest start
  // --watch` compilando sin los .d.ts del package y falla el primer build.
  clean: !options.watch,
  format: ['cjs', 'esm'],
  outDir: 'dist',
  target: ['node24'],
}));
