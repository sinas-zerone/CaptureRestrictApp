import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  /// Privacy blur overlay — shown when app is backgrounded to prevent
  /// app switcher from capturing sensitive content as a thumbnail.
  private var privacyBlurView: UIVisualEffectView?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "CaptureRestrictApp",
      in: window,
      launchOptions: launchOptions
    )

    return true
  }

  // MARK: - App Lifecycle (Privacy Protection)

  /// Called when the app is about to move from active to inactive state.
  /// We add a blur overlay to prevent the app switcher from capturing
  /// a readable screenshot of the current screen.
  func applicationWillResignActive(_ application: UIApplication) {
    showPrivacyBlur()
  }

  /// Called when the app returns to the foreground.
  /// Remove the blur overlay so the user can see the content again.
  func applicationDidBecomeActive(_ application: UIApplication) {
    removePrivacyBlur()
  }

  // MARK: - Privacy Blur Helpers

  private func showPrivacyBlur() {
    guard privacyBlurView == nil, let window = self.window else { return }

    let blurEffect = UIBlurEffect(style: .dark)
    let overlay = UIVisualEffectView(effect: blurEffect)
    overlay.frame = window.bounds
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    overlay.tag = 8888 // Different tag from CaptureRestrictModule's overlay

    window.addSubview(overlay)
    privacyBlurView = overlay
  }

  private func removePrivacyBlur() {
    privacyBlurView?.removeFromSuperview()
    privacyBlurView = nil
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
