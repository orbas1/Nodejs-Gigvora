export default {
  testEnvironment: 'node',
  verbose: false,
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setupTestEnv.js'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
  ],
  coverageDirectory: '<rootDir>/coverage',
};
