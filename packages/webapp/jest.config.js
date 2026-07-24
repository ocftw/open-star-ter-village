/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
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
