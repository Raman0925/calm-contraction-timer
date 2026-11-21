// SPDX-License-Identifier: Apache-2.0
import NativeAppConfig from './NativeAppConfig';

/** Build-type configuration set by Gradle (see android/app/build.gradle). */
export const appConfig = {
  adBannerUnitId: (): string => NativeAppConfig.adBannerUnitId(),
};
