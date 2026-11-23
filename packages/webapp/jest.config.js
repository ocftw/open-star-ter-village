/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.next/'],
  // jose 6 is ESM-only; let ts-jest compile it to CommonJS for these tests.
  transformIgnorePatterns: [
    '/node_modules/.pnpm/(?!jose@)',
    '/node_modules/(?!\\.pnpm/|jose/)',
  ],
  transform: {
    '^.+/jose/dist/.+\\.js$': ['ts-jest', {
      tsconfig: { allowJs: true, module: 'commonjs', target: 'es2022' },
      diagnostics: false,
    }],
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node',
        esModuleInterop: true,
        resolveJsonModule: true,
        strict: true,
        jsx: 'react-jsx',
        paths: {
          '@/*': ['./src/*'],
        },
      },
    }],
  },
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
};

module.exports = config;
