module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  reporters: [
    'default',
    [
      'jest-junit',
      {
        suiteName: 'access-token-jwt',
        outputDirectory: '../../test-results/access-token-jwt',
      },
    ],
  ],
  testEnvironment: 'node',
  collectCoverageFrom: ['src/*'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  moduleNameMapper: {
    '^oauth2-bearer$': '<rootDir>/../oauth2-bearer/src/',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        baseUrl: '.',
        paths: {
          'oauth2-bearer': ['../oauth2-bearer/src'],
        },
      },
    },
  },
};
