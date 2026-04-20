package com.capturerestrictapp

import android.view.WindowManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil

/**
 * CaptureRestrictModule — Native Android module for screenshot/recording prevention
 *
 * Uses WindowManager.LayoutParams.FLAG_SECURE to prevent:
 * - Screenshots (they appear black/blank)
 * - Screen recording (recorded frames appear black)
 * - Recent apps thumbnail (shown as blank)
 *
 * FLAG_SECURE is the gold standard for Android capture prevention —
 * it operates at the compositor level, so no workaround exists.
 */
class CaptureRestrictModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CaptureRestrictModule"

    /**
     * Enable secure mode by setting FLAG_SECURE on the current activity's window.
     * Runs on the UI thread since window flags can only be modified there.
     */
    @ReactMethod
    fun enableSecureMode(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "Current activity is null")
            return
        }

        UiThreadUtil.runOnUiThread {
            try {
                activity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("E_SECURE_MODE", "Failed to enable secure mode", e)
            }
        }
    }

    /**
     * Disable secure mode by clearing FLAG_SECURE.
     * This restores normal screenshot/recording behavior.
     */
    @ReactMethod
    fun disableSecureMode(promise: Promise) {
        val activity = getCurrentActivity()
        if (activity == null) {
            promise.reject("E_NO_ACTIVITY", "Current activity is null")
            return
        }

        UiThreadUtil.runOnUiThread {
            try {
                activity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("E_SECURE_MODE", "Failed to disable secure mode", e)
            }
        }
    }
}
