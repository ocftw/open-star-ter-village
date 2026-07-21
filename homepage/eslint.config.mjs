import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier/flat';

export default defineConfig([
  ...nextVitals,
  prettier,
  globalIgnores([
    '.next/**',
    '.pnpm-store/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
  ]),
]);
