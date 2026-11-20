// SPDX-License-Identifier: Apache-2.0
import NativeKeepAwake from './NativeKeepAwake';

/** Keeps the screen on. Implemented natively; faked in tests. */
export interface KeepAwake {
  activate(): void;
  deactivate(): void;
}

/** KeepAwake backed by the Kotlin TurboModule. */
export const nativeKeepAwake: KeepAwake = {
  activate: () => {
    NativeKeepAwake.activate();
  },
  deactivate: () => {
    NativeKeepAwake.deactivate();
  },
};
