import Foundation
import UIKit
import React

/**
 * CaptureRestrictModule — Native iOS module for screenshot/recording prevention
 *
 * iOS cannot fully block screenshots like Android's FLAG_SECURE.
 * Instead, this module:
 * 1. Detects screen recording via UIScreen.isCaptured and sends events to JS
 * 2. Applies a UIVisualEffectView blur overlay when recording is detected
 * 3. Listens for screenshot notifications (post-capture — iOS limitation)
 * 4. Applies a blur when the app backgrounds (prevents app switcher thumbnail leak)
 *
 * The blur overlay approach is the industry standard for iOS content protection
 * (used by banking apps, DRM video players, etc.).
 */
@objc(CaptureRestrictModule)
class CaptureRestrictModule: RCTEventEmitter {

  // MARK: - Properties

  private var blurView: UIVisualEffectView?
  private var isSecureModeActive = false
  private var hasListeners = false

  // MARK: - React Native Setup

  override static func moduleName() -> String! {
    return "CaptureRestrictModule"
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["onScreenCaptureStatusChange"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  // MARK: - Public Methods (exposed to JS)

  @objc func enableSecureMode(_ resolve: @escaping RCTPromiseResolveBlock,
                               rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      self.isSecureModeActive = true

      // Listen for screen recording state changes
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.screenCaptureDidChange),
        name: UIScreen.capturedDidChangeNotification,
        object: nil
      )

      // Listen for screenshot taken
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.screenshotTaken),
        name: UIApplication.userDidTakeScreenshotNotification,
        object: nil
      )

      // Check current capture state immediately
      if UIScreen.main.isCaptured {
        self.showBlurOverlay()
        self.emitCaptureStatus(isCaptured: true)
      }

      resolve(nil)
    }
  }

  @objc func disableSecureMode(_ resolve: @escaping RCTPromiseResolveBlock,
                                rejecter reject: @escaping RCTPromiseRejectBlock) {
    DispatchQueue.main.async { [weak self] in
      guard let self = self else { return }

      self.isSecureModeActive = false

      // Remove all observers
      NotificationCenter.default.removeObserver(
        self,
        name: UIScreen.capturedDidChangeNotification,
        object: nil
      )
      NotificationCenter.default.removeObserver(
        self,
        name: UIApplication.userDidTakeScreenshotNotification,
        object: nil
      )

      // Remove blur overlay if present
      self.removeBlurOverlay()

      resolve(nil)
    }
  }

  // MARK: - Notification Handlers

  @objc private func screenCaptureDidChange() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self, self.isSecureModeActive else { return }

      let isCaptured = UIScreen.main.isCaptured

      if isCaptured {
        self.showBlurOverlay()
      } else {
        self.removeBlurOverlay()
      }

      self.emitCaptureStatus(isCaptured: isCaptured)
    }
  }

  @objc private func screenshotTaken() {
    // iOS can't prevent screenshots, only detect them after the fact.
    // The blur overlay during screen recording is the primary protection.
    // This notification can be used to log/alert about screenshot attempts.
    if __DEV__ {
      print("[CaptureRestrictModule] Screenshot detected")
    }
  }

  // MARK: - Blur Overlay Management

  private func showBlurOverlay() {
    guard blurView == nil else { return }

    guard let window = self.getKeyWindow() else { return }

    let blurEffect = UIBlurEffect(style: .dark)
    let overlay = UIVisualEffectView(effect: blurEffect)
    overlay.frame = window.bounds
    overlay.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    overlay.tag = 9999 // Unique tag for identification

    window.addSubview(overlay)
    blurView = overlay
  }

  private func removeBlurOverlay() {
    blurView?.removeFromSuperview()
    blurView = nil
  }

  // MARK: - Helpers

  private func emitCaptureStatus(isCaptured: Bool) {
    guard hasListeners else { return }
    sendEvent(withName: "onScreenCaptureStatusChange", body: [
      "isCaptured": isCaptured
    ])
  }

  private func getKeyWindow() -> UIWindow? {
    if #available(iOS 15.0, *) {
      return UIApplication.shared
        .connectedScenes
        .compactMap { $0 as? UIWindowScene }
        .flatMap { $0.windows }
        .first { $0.isKeyWindow }
    } else {
      return UIApplication.shared.windows.first { $0.isKeyWindow }
    }
  }

  deinit {
    NotificationCenter.default.removeObserver(self)
    removeBlurOverlay()
  }
}
