import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import serve from 'rollup-plugin-serve';
import json from '@rollup/plugin-json';

const dev = process.env.ROLLUP_WATCH;

const serveopts = {
  contentBase: ['./dist'],
  host: '0.0.0.0',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

const plugins = [
  nodeResolve({
    preferBuiltins: false,
    browser: true,
  }),
  commonjs(),
  typescript({
    // Only build the card from src/. The e2e/ dir is a separate Playwright
    // project with its own deps (@playwright/test) and must not be typechecked
    // here, or CI build fails with TS2307 (deps only in e2e/node_modules).
    include: ['src/**/*'],
    exclude: ['**/__tests__', '**/*.test.ts', 'e2e', 'docs_site'],
    compilerOptions: {
      noEmit: false,
      outDir: 'dist',
    },
  }),
  json(),
  dev && serve(serveopts),
  !dev && terser(),
];

export default [
  {
    input: 'src/linked-lovelace-ui.ts',
    output: {
      dir: 'dist',
      format: 'es',
      inlineDynamicImports: true,
    },
    plugins: [...plugins],
  },
];
