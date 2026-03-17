/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
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
        paths: {
          '@/*': ['./src/*'],
        },
      },
    }],
  },
  testMatch: ['**/*.test.ts'],
};

module.exports = config;
