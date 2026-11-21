// SPDX-License-Identifier: Apache-2.0
package com.calmcontractiontimer.app.liveupdate

import android.app.Notification
import android.app.NotificationManager
import android.os.Build
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.calmcontractiontimer.app.specs.NativeLiveUpdateSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Promotes the ongoing session notification to an Android 16 Live Update.
 *
 * The notification is posted by react-native-notify-kit, which cannot request
 * promotion itself. This rebuilds the posted notification with
 * Notification.Builder.recoverBuilder (keeping its chronometer and Start/Stop
 * actions), adds the promotion request and a status-bar chip text, and posts it
 * again under the same id and tag.
 */
class LiveUpdateModule(reactContext: ReactApplicationContext) : NativeLiveUpdateSpec(reactContext) {

  override fun getName(): String = NAME

  override fun promote(channelId: String, shortText: String, promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.BAKLAVA) {
      promise.resolve(false)
      return
    }
    try {
      promise.resolve(promoteOnAndroid16(channelId, shortText))
    } catch (error: RuntimeException) {
      promise.reject("live_update_failed", error.message, error)
    }
  }

  @RequiresApi(Build.VERSION_CODES.BAKLAVA)
  private fun promoteOnAndroid16(channelId: String, shortText: String): Boolean {
    val manager = reactApplicationContext.getSystemService(NotificationManager::class.java)
    // The user can turn Live Updates off for the app in system settings.
    if (manager == null || !manager.canPostPromotedNotifications()) {
      return false
    }
    val posted = manager.activeNotifications.firstOrNull { it.notification.channelId == channelId }
      ?: return false
    val builder = Notification.Builder.recoverBuilder(reactApplicationContext, posted.notification)
      .setShortCriticalText(shortText)
    builder.extras.putBoolean(NotificationCompat.EXTRA_REQUEST_PROMOTED_ONGOING, true)
    manager.notify(posted.tag, posted.id, builder.build())
    return true
  }

  companion object {
    const val NAME = "LiveUpdate"
  }
}
