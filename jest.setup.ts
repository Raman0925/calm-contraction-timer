// SPDX-License-Identifier: Apache-2.0
import { configure } from '@testing-library/react-native';
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';
import { initI18n } from './src/core/i18n';
import { useSettingsStore } from './src/features/settings/data/settingsStore';

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
jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fs: {
      dirs: { CacheDir: '/cache' },
      writeFile: jest.fn(),
      exists: jest.fn(() => Promise.resolve(false)),
      mkdir: jest.fn(),
      unlink: jest.fn(),
    },
  },
}));
jest.mock('react-native-iap', () => ({
  // Same string values as react-native-iap's ErrorCode enum.
  ErrorCode: {
    UserCancelled: 'user-cancelled',
    Pending: 'pending',
    AlreadyOwned: 'already-owned',
    NetworkError: 'network-error',
    BillingUnavailable: 'billing-unavailable',
    ItemUnavailable: 'item-unavailable',
    ServiceError: 'service-error',
  },
  initConnection: jest.fn(() => Promise.resolve(true)),
  endConnection: jest.fn(() => Promise.resolve(true)),
  fetchProducts: jest.fn(() => Promise.resolve([])),
  getAvailablePurchases: jest.fn(() => Promise.resolve([])),
  requestPurchase: jest.fn(() => Promise.resolve(null)),
  finishTransaction: jest.fn(() => Promise.resolve()),
  purchaseUpdatedListener: jest.fn(() => ({ remove: jest.fn() })),
  purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('react-native-share', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('./src/core/native/NativeKeepAwake', () => ({
  __esModule: true,
  default: { activate: jest.fn(), deactivate: jest.fn() },
}));

initI18n();

// Database calls are asynchronous, as on a device; give screens time when the suite runs in parallel.
configure({ asyncUtilTimeout: 5_000 });

// Most tests start after onboarding; onboarding tests reset this to null.
beforeEach(() => {
  useSettingsStore.setState({ disclaimerAcceptedAt: Date.UTC(2026, 0, 1) });
});
