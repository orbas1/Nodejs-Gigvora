const TEST_DIRECTORIES = [
  '<rootDir>/tests/controllers/**/*.test.js',
  '<rootDir>/tests/config/**/*.test.js',
  '<rootDir>/tests/lifecycle/**/*.test.js',
  '<rootDir>/tests/migrations/**/*.test.js',
  '<rootDir>/src/services/__tests__/**/*.test.js',
];

if (typeof process.env.SKIP_SEQUELIZE_BOOTSTRAP === 'undefined') {
  process.env.SKIP_SEQUELIZE_BOOTSTRAP = 'true';
}

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
    '(.*/)?models/index\\.js$': '<rootDir>/tests/stubs/modelsIndexStub.js',
    '(.*/)?models/constants/index\\.js$': '<rootDir>/tests/stubs/modelConstantsStub.js',
  },
  testMatch: TEST_DIRECTORIES,
  testPathIgnorePatterns: ['/node_modules/'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/models/**',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
