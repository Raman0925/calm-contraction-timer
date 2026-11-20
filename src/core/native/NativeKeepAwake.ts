// SPDX-License-Identifier: Apache-2.0
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/** Codegen spec for the KeepAwake TurboModule (android/.../KeepAwakeModule.kt). */
export interface Spec extends TurboModule {
  /** Keeps the screen on while the app's window is visible (FLAG_KEEP_SCREEN_ON). */
  activate(): void;
  /** Lets the screen turn off again. */
  deactivate(): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('KeepAwake');
