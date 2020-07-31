module.exports = {
  roots: ['<rootDir>'],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  testMatch: ['<rootDir>/packages/**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverageFrom: ['packages/**/src/**/*.ts', '!packages/**/src/__tests__/**'],
  moduleNameMapper: {
    '^alliage-di/(.*)$': '<rootDir>/packages/dependency-injection/src/$1',
    '^alliage-lifecycle/(.*)$': '<rootDir>/packages/lifecycle/src/$1',
    '^alliage-process-manager/(.*)$': '<rootDir>/packages/process-manager/src/$1',
    '^alliage-config-loader/(.*)$': '<rootDir>/packages/configuration-loader/src/$1',
    '^alliage-events-listener-loader/(.*)$': '<rootDir>/packages/events-listener-loader/src/$1',
  },
  resolver: '<rootDir>/test-utils/resolver',
  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.json',
    },
  },
};
