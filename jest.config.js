// SPDX-License-Identifier: Apache-2.0
// Run every test in UTC so date formatting is the same on every machine.
process.env.TZ = 'UTC';

/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Screen tests render the whole app on in-memory SQLite; CI runners are slower than laptops.
  testTimeout: 20_000,
  moduleNameMapper: { '[.]ttf$': '<rootDir>/jest/assetStub.js' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-paper|@react-native-vector-icons|react-native-mmkv|react-native-nitro-modules|react-native-safe-area-context|react-native-screens|react-native-notify-kit|react-native-haptic-feedback|@op-engineering|react-native-gifted-charts|gifted-charts-core|react-native-svg)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/testing/**',
    '!src/core/db/client.ts',
    // Native wiring only: opens the on-device database.
    '!src/features/timer/data/repositoryInstance.ts',
    '!src/core/db/database.ts',
  ],
  coverageThreshold: {
    './src/features/**/domain/**/*.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
    './src/features/**/data/**/*.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
  },
};
