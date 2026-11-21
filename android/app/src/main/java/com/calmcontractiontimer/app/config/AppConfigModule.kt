// SPDX-License-Identifier: Apache-2.0
package com.calmcontractiontimer.app.config

import com.calmcontractiontimer.app.BuildConfig
import com.calmcontractiontimer.app.specs.NativeAppConfigSpec
import com.facebook.react.bridge.ReactApplicationContext

/** Exposes per-build-type values from Gradle's BuildConfig to JavaScript. */
class AppConfigModule(reactContext: ReactApplicationContext) : NativeAppConfigSpec(reactContext) {

  override fun getName(): String = NAME

  override fun adBannerUnitId(): String = BuildConfig.AD_BANNER_UNIT_ID

  companion object {
    const val NAME = "AppConfig"
  }
}
