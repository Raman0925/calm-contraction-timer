// SPDX-License-Identifier: Apache-2.0
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
import { initI18n } from './src/core/i18n';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// MMKV switches to its in-memory mock under Jest, but still imports Nitro eagerly.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: jest.fn() },
}));

initI18n();
