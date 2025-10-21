export default {
  testEnvironment: 'node',
  verbose: false,
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setupTestEnv.js'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  extensionsToTreatAsEsm: [],
  moduleNameMapper: {
    '^pino-http$': '<rootDir>/tests/stubs/pinoHttpStub.js',
    '^pino$': '<rootDir>/tests/stubs/pinoStub.js',
    '^express-rate-limit$': '<rootDir>/tests/stubs/expressRateLimitStub.js',
    '^zod$': '<rootDir>/tests/stubs/zodStub.js',
    '^compression$': '<rootDir>/tests/stubs/compressionStub.js',
  },
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/models/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
