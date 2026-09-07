module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.cjs'],
  testTimeout: 15000,
  // Tests exercise compiled artifacts; no alternate TypeScript transform pipeline.
  transform: {},
};
