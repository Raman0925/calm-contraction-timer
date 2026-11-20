// SPDX-License-Identifier: Apache-2.0
/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '[.]ttf$': '<rootDir>/jest/assetStub.js' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-paper|@react-native-vector-icons|react-native-mmkv|react-native-nitro-modules|react-native-safe-area-context|react-native-screens)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/testing/**',
    '!src/core/db/client.ts',
    '!src/core/db/database.ts',
  ],
  coverageThreshold: {
    './src/features/**/domain/**/*.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/features/**/data/**/*.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
