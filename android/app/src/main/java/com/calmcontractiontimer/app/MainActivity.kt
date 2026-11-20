// SPDX-License-Identifier: Apache-2.0
package com.calmcontractiontimer.app

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/** Single activity hosting the React Native app. */
class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "CalmContractionTimer"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
