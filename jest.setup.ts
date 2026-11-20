// SPDX-License-Identifier: Apache-2.0
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
import { initI18n } from './src/core/i18n';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);

// MMKV switches to its in-memory mock under Jest, but still imports Nitro eagerly.
jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: jest.fn() },
}));

// Native modules that have no JS fallback. Tests use fakes from */testing/ instead.
jest.mock('react-native-notify-kit', () =>
  jest.requireActual<object>('react-native-notify-kit/jest-mock'),
);
jest.mock('react-native-haptic-feedback', () => ({ trigger: jest.fn() }));
jest.mock('@op-engineering/op-sqlite', () => ({ open: jest.fn() }));
jest.mock('./src/core/native/NativeKeepAwake', () => ({
  __esModule: true,
  default: { activate: jest.fn(), deactivate: jest.fn() },
}));

initI18n();
