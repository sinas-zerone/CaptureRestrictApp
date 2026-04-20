package com.capturerestrictapp

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * CaptureRestrictPackage — Registers our native module with React Native
 *
 * This package is added to the packages list in MainApplication.kt
 * so React Native can discover and instantiate CaptureRestrictModule.
 */
class CaptureRestrictPackage : ReactPackage {

    override fun createNativeModules(
        reactContext: ReactApplicationContext
    ): List<NativeModule> {
        return listOf(CaptureRestrictModule(reactContext))
    }

    override fun createViewManagers(
        reactContext: ReactApplicationContext
    ): List<ViewManager<*, *>> {
        return emptyList()
    }
}
