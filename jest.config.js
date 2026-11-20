// SPDX-License-Identifier: Apache-2.0
/** @type {import('jest').Config} */
module.exports = {
  preset: '@react-native/jest-preset',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '[.]ttf$': '<rootDir>/jest/assetStub.js' },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-paper|@react-native-vector-icons|react-native-mmkv|react-native-nitro-modules|react-native-safe-area-context|react-native-screens)/)',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/index.ts'],
};
