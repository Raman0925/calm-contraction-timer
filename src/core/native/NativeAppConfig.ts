// SPDX-License-Identifier: Apache-2.0
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/** Codegen spec for the AppConfig TurboModule (android/.../AppConfigModule.kt). */
export interface Spec extends TurboModule {
  /** AdMob banner unit for this build type: Google's test unit unless a release provides one. */
  adBannerUnitId(): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('AppConfig');
