package com.capturerestrictapp

import android.os.Bundle
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "CaptureRestrictApp"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  /**
   * Set FLAG_SECURE as early as possible (before the first frame renders).
   * This is the "belt" — CaptureRestrictModule.enableSecureMode() from JS is the "suspenders".
   * Having it here ensures the window is secure even before React Native boots.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
      super.onCreate(savedInstanceState)
      window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }
}
