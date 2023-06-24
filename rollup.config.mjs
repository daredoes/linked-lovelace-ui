import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import json from '@rollup/plugin-json';
import eta from 'rollup-plugin-eta';
import nodeExternals from 'rollup-plugin-node-externals'



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
  nodeResolve(),
  commonjs({
    namedExports: {
      // left-hand side can be an absolute path, a path
      // relative to the current directory, or the name
      // of a module in node_modules
      'yaml': [ 'parse' ]
    }
  }),
  typescript({
    tsconfigOverride: {
      exclude: ["**/__tests__", "**/*.test.ts"]
    }
  }),
  json(),
  babel({
    exclude: ['node_modules/**', 'src/**/*.test.ts'],
  }),
  dev && serve(serveopts),
  !dev && terser(),
  eta({
    include: ['**/*.eta', '**/*.html'], // optional, '**/*.eta' by default
    exclude: ['**/index.html'], // optional, undefined by default
}),
];

export default [
  {
    input: 'src/linked-lovelace-ui.ts',
    output: {
      dir: 'dist',
      format: 'es',
      inlineDynamicImports: true
    },
    plugins: [...plugins]
  },
];
