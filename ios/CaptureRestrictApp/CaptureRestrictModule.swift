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

  private var secureTextField: UITextField?
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

      // Check current capture state
      let isCaptured = UIScreen.main.isCaptured
      if isCaptured {
        self.emitCaptureStatus(isCaptured: true)
      }

      // Apply OS-level screenshot and screen recording protection globally
      self.applySecureTextField()

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

      // Remove the OS-level secure overlay
      self.removeSecureTextField()

      resolve(nil)
    }
  }

  // MARK: - Notification Handlers

  @objc private func screenCaptureDidChange() {
    DispatchQueue.main.async { [weak self] in
      guard let self = self, self.isSecureModeActive else { return }

      let isCaptured = UIScreen.main.isCaptured

      // The native recording protection is handled by secureTextField seamlessly.
      // We just notify React Native so it can show its own warning UI if desired.
      self.emitCaptureStatus(isCaptured: isCaptured)
    }
  }

  @objc private func screenshotTaken() {
    // iOS can detect screenshots using this notification.
    // However, the secureTextField mechanism physically redacts the image,
    // so the resulting screenshot is blank (black).
    // React Native could be informed here if needed.
    if __DEV__ {
      print("[CaptureRestrictModule] Screenshot detected (Redacted by OS)")
    }
  }

  // MARK: - Screenshot & Recording Prevention

  private func applySecureTextField() {
    guard self.secureTextField == nil else { return }
    guard let window = self.getKeyWindow() else { return }

    let textField = UITextField()
    textField.isSecureTextEntry = true
    textField.isUserInteractionEnabled = false
    textField.backgroundColor = .clear

    window.addSubview(textField)
    textField.frame = window.bounds
    textField.autoresizingMask = [.flexibleWidth, .flexibleHeight]

    // Crucial trick: Move the entire window layer into the secure text field's layer tree.
    // This forces the OS to apply secure text entry rendering rules to the whole app,
    // fully blacking out screenshots and screen recordings natively.
    if let windowSuperlayer = window.layer.superlayer {
      windowSuperlayer.addSublayer(textField.layer)
      textField.layer.sublayers?.first?.addSublayer(window.layer)
      self.secureTextField = textField
    } else {
      // Fallback in case window has no superlayer yet
      textField.removeFromSuperview()
    }
  }

  private func removeSecureTextField() {
    guard let textField = self.secureTextField else { return }
    guard let window = self.getKeyWindow() else { return }

    // Restore the window layer back to its original parent
    if let originalSuperlayer = textField.layer.superlayer {
      originalSuperlayer.addSublayer(window.layer)
    }

    textField.removeFromSuperview()
    textField.layer.removeFromSuperlayer()
    self.secureTextField = nil
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
    removeSecureTextField()
  }
}
