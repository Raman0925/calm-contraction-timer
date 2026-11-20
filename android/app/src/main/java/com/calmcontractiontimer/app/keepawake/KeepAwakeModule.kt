// SPDX-License-Identifier: Apache-2.0
package com.calmcontractiontimer.app.keepawake

import android.view.WindowManager
import com.calmcontractiontimer.app.specs.NativeKeepAwakeSpec
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil

/**
 * Keeps the screen on while the timer is visible, using FLAG_KEEP_SCREEN_ON (no wake lock).
 * The requested state is re-applied on every resume, because a recreated activity
 * (for example after a font-size change) starts with a fresh window.
 */
class KeepAwakeModule(reactContext: ReactApplicationContext) :
    NativeKeepAwakeSpec(reactContext), LifecycleEventListener {

  @Volatile private var keepOn = false

  init {
    reactContext.addLifecycleEventListener(this)
  }

  override fun getName(): String = NAME

  override fun activate() {
    keepOn = true
    applyFlag()
  }

  override fun deactivate() {
    keepOn = false
    applyFlag()
  }

  override fun onHostResume() = applyFlag()

  override fun onHostPause() = Unit

  override fun onHostDestroy() = Unit

  override fun invalidate() {
    reactApplicationContext.removeLifecycleEventListener(this)
    super.invalidate()
  }

  private fun applyFlag() {
    UiThreadUtil.runOnUiThread {
      val window = reactApplicationContext.currentActivity?.window ?: return@runOnUiThread
      if (keepOn) {
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      } else {
        window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
      }
    }
  }

  companion object {
    const val NAME = "KeepAwake"
  }
}
