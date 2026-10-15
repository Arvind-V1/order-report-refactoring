module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  // ts avant js : legacy/ peut contenir le .js ET le .ts
  moduleFileExtensions: ['ts', 'js', 'json'],
};