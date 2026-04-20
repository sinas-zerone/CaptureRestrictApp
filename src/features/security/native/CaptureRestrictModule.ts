/**
 * CaptureRestrictModule — TypeScript bridge to native module
 *
 * Wraps the native CaptureRestrictModule (Android/iOS) with typed APIs.
 * Provides both imperative methods and an event emitter for capture events.
 *
 * Android: Uses FLAG_SECURE (blocks screenshots & recording at OS level)
 * iOS: Uses UIScreen.captured + blur overlay (detects & obscures)
 */

import { NativeModules, NativeEventEmitter, Platform } from 'react-native';
import { NATIVE_EVENTS } from '@core/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CaptureRestrictNativeModule {
  enableSecureMode(): Promise<void>;
  disableSecureMode(): Promise<void>;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export interface ScreenCaptureEvent {
  /** Whether the screen is currently being captured/recorded */
  isCaptured: boolean;
}

// ---------------------------------------------------------------------------
// Module Reference (resolved once, cached)
// ---------------------------------------------------------------------------

const NativeModule: CaptureRestrictNativeModule =
  NativeModules.CaptureRestrictModule;

if (!NativeModule && __DEV__) {
  console.error(
    '[CaptureRestrictModule] Native module not found. ' +
      'Did you run `pod install` (iOS) or rebuild the Android project?',
  );
}

// ---------------------------------------------------------------------------
// Event Emitter (only created once)
// ---------------------------------------------------------------------------

let emitterInstance: NativeEventEmitter | null = null;

function getEmitter(): NativeEventEmitter {
  if (!emitterInstance) {
    emitterInstance = new NativeEventEmitter(NativeModule as any);
  }
  return emitterInstance;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Enable secure mode — prevents screenshots and screen recording.
 * Android: Sets FLAG_SECURE on the window.
 * iOS: Enables capture detection and blur overlay.
 */
export async function enableSecureMode(): Promise<void> {
  if (!NativeModule) return;
  return NativeModule.enableSecureMode();
}

/**
 * Disable secure mode — restores normal screenshot behavior.
 */
export async function disableSecureMode(): Promise<void> {
  if (!NativeModule) return;
  return NativeModule.disableSecureMode();
}

/**
 * Subscribe to screen capture status changes (iOS only).
 * On Android, FLAG_SECURE blocks capture at the OS level, so no events needed.
 *
 * @returns Cleanup function to unsubscribe
 */
export function onScreenCaptureChange(
  callback: (event: ScreenCaptureEvent) => void,
): () => void {
  if (Platform.OS !== 'ios' || !NativeModule) {
    return () => {};
  }

  const subscription = getEmitter().addListener(
    NATIVE_EVENTS.SCREEN_CAPTURE_STATUS_CHANGE,
    callback,
  );

  return () => subscription.remove();
}

/**
 * Reset internal state. Only used in tests to clear the cached emitter
 * between test runs and prevent stale mock state.
 */
export function __resetForTesting(): void {
  emitterInstance = null;
}
