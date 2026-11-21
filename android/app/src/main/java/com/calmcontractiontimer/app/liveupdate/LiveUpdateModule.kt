// SPDX-License-Identifier: Apache-2.0
package com.calmcontractiontimer.app.liveupdate

import android.app.Notification
import android.app.NotificationManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.service.notification.StatusBarNotification
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import com.calmcontractiontimer.app.specs.NativeLiveUpdateSpec
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext

/**
 * Promotes the ongoing session notification to an Android 16 Live Update.
 *
 * The notification is posted by react-native-notify-kit, which cannot request
 * promotion itself. This finds the notification that was just posted (same
 * channel and timestamp, retrying briefly because posting is asynchronous),
 * rebuilds it with Notification.Builder.recoverBuilder (keeping its chronometer
 * and Start/Stop actions), adds the promotion request and a status-bar chip
 * text, and posts it again under the same id and tag.
 */
class LiveUpdateModule(reactContext: ReactApplicationContext) : NativeLiveUpdateSpec(reactContext) {

  private val handler = Handler(Looper.getMainLooper())

  override fun getName(): String = NAME

  override fun promote(channelId: String, shortText: String, postedWhen: Double, promise: Promise) {
    // Promotion of ongoing notifications without colour arrived in Android 16 QPR2 (36.1).
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.BAKLAVA ||
        Build.VERSION.SDK_INT_FULL < ANDROID_16_QPR2) {
      promise.resolve(false)
      return
    }
    attempt(channelId, shortText, postedWhen.toLong(), RETRIES, promise)
  }

  @RequiresApi(Build.VERSION_CODES.BAKLAVA)
  private fun attempt(
      channelId: String,
      shortText: String,
      postedWhen: Long,
      retriesLeft: Int,
      promise: Promise,
  ) {
    try {
      val manager = reactApplicationContext.getSystemService(NotificationManager::class.java)
      // The user can turn Live Updates off for the app in system settings.
      if (manager == null || !manager.canPostPromotedNotifications()) {
        promise.resolve(false)
        return
      }
      val posted = findPosted(manager, channelId, postedWhen)
      when {
        posted != null -> {
          repost(manager, posted, shortText)
          promise.resolve(true)
        }
        retriesLeft > 0 ->
            handler.postDelayed(
                { attempt(channelId, shortText, postedWhen, retriesLeft - 1, promise) },
                RETRY_DELAY_MS,
            )
        else -> promise.resolve(false)
      }
    } catch (error: RuntimeException) {
      promise.reject("live_update_failed", error.message, error)
    }
  }

  /** Only the version just posted: an older one must never be put back. */
  private fun findPosted(
      manager: NotificationManager,
      channelId: String,
      postedWhen: Long,
  ): StatusBarNotification? =
      manager.activeNotifications.firstOrNull {
        it.notification.channelId == channelId && it.notification.`when` == postedWhen
      }

  @RequiresApi(Build.VERSION_CODES.BAKLAVA)
  private fun repost(manager: NotificationManager, posted: StatusBarNotification, shortText: String) {
    val builder =
        Notification.Builder.recoverBuilder(reactApplicationContext, posted.notification)
            .setShortCriticalText(shortText)
    builder.extras.putBoolean(NotificationCompat.EXTRA_REQUEST_PROMOTED_ONGOING, true)
    manager.notify(posted.tag, posted.id, builder.build())
  }

  companion object {
    const val NAME = "LiveUpdate"
    /** Build.VERSION_CODES_FULL.BAKLAVA_1, which the API 36 SDK does not define yet. */
    private const val ANDROID_16_QPR2 = 3_600_001
    private const val RETRIES = 3
    private const val RETRY_DELAY_MS = 50L
  }
}
