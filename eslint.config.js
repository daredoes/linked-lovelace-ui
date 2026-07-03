import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Lint the card source only. e2e/ and docs_site/ are separate projects
    // with their own dependencies.
    ignores: [
      'dist/',
      'node_modules/',
      'e2e/',
      'docs_site/',
      'rollup-plugins/',
      '*.config.js',
      '*.cjs',
      // Vendored google-diff-match-patch fork; not our style to enforce.
      'src/helpers/diff.js',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // HA card configs are untyped JSON blobs; `any` is pervasive in the
      // existing type surface. Warn instead of error until types tighten.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
