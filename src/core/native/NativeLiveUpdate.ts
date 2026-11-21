// SPDX-License-Identifier: Apache-2.0
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/** Codegen spec for the LiveUpdate TurboModule (android/.../LiveUpdateModule.kt). */
export interface Spec extends TurboModule {
  /**
   * Asks Android 16+ to show the ongoing notification in `channelId` as a Live
   * Update (status-bar chip and top of the shade), with `shortText` in the chip.
   * Resolves false when unsupported, not allowed by the user, or not found.
   */
  promote(channelId: string, shortText: string): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('LiveUpdate');
