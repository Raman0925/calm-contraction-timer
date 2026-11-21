// SPDX-License-Identifier: Apache-2.0
import { configure } from '@testing-library/react-native';
import type * as ReactModule from 'react';
import type * as ReactNativeModule from 'react-native';
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
      readFile: jest.fn(),
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
jest.mock('@react-native-documents/picker', () => ({
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: (error: unknown) =>
    typeof error === 'object' && error !== null && 'code' in error,
  types: { allFiles: '*/*' },
  pick: jest.fn(),
  saveDocuments: jest.fn(),
}));
jest.mock('react-native-share', () => ({ __esModule: true, default: { open: jest.fn() } }));
jest.mock('./src/core/native/NativeAppConfig', () => ({
  __esModule: true,
  default: { adBannerUnitId: () => 'ca-app-pub-3940256099942544/9214589741' },
}));
jest.mock('react-native-google-mobile-ads', () => {
  const consent = { canRequestAds: false, privacyOptionsRequirementStatus: 'NOT_REQUIRED' };
  return {
    __esModule: true,
    default: jest.fn(() => ({
      initialize: jest.fn(() => Promise.resolve([])),
      setRequestConfiguration: jest.fn(() => Promise.resolve()),
    })),
    AdsConsent: {
      getConsentInfo: jest.fn(() => Promise.resolve(consent)),
      requestInfoUpdate: jest.fn(() => Promise.resolve(consent)),
      loadAndShowConsentFormIfRequired: jest.fn(() => Promise.resolve(consent)),
      showPrivacyOptionsForm: jest.fn(() => Promise.resolve(consent)),
    },
    AdsConsentPrivacyOptionsRequirementStatus: {
      REQUIRED: 'REQUIRED',
      NOT_REQUIRED: 'NOT_REQUIRED',
    },
    MaxAdContentRating: { G: 'G' },
    AgeRestrictedTreatment: { UNSPECIFIED: 'unspecified' },
    BannerAdSize: { LARGE_ANCHORED_ADAPTIVE_BANNER: 'LARGE_ANCHORED_ADAPTIVE_BANNER' },
    // Renders a marker so tests can see where a banner is mounted.
    BannerAd: jest.fn(() => {
      const { createElement } = jest.requireActual<typeof ReactModule>('react');
      const { View } = jest.requireActual<typeof ReactNativeModule>('react-native');
      return createElement(View, { testID: 'banner-ad' });
    }),
  };
});
jest.mock('./src/core/native/NativeLiveUpdate', () => ({
  __esModule: true,
  default: { promote: jest.fn(() => Promise.resolve(false)) },
}));
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
