/**
 * useCaptureRestriction — Orchestrates screenshot & recording prevention
 *
 * Responsibilities:
 * 1. Enables secure mode on mount, disables on unmount
 * 2. Re-enables secure mode when app returns to foreground
 * 3. Subscribes to iOS screen capture events
 * 4. Provides `isScreenBeingCaptured` state for UI consumption
 *
 * Performance optimizations:
 * - useRef for subscription references (avoids stale closures)
 * - useCallback for the foreground handler (stable reference)
 * - Single effect with comprehensive cleanup
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import {
  enableSecureMode,
  disableSecureMode,
  onScreenCaptureChange,
} from '../native/CaptureRestrictModule';

interface CaptureRestrictionState {
  /** Whether the screen is currently being captured/recorded (iOS only) */
  isScreenBeingCaptured: boolean;
  /** Whether secure mode is currently active */
  isSecureModeEnabled: boolean;
}

export function useCaptureRestriction(): CaptureRestrictionState {
  const [isScreenBeingCaptured, setIsScreenBeingCaptured] = useState(false);
  const [isSecureModeEnabled, setIsSecureModeEnabled] = useState(false);

  // Track AppState to avoid stale closures in the listener callback
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Stable function: activate secure mode and update state
  const activate = useCallback(async () => {
    try {
      await enableSecureMode();
      setIsSecureModeEnabled(true);
    } catch (error) {
      if (__DEV__) {
        console.error('[useCaptureRestriction] Failed to enable:', error);
      }
    }
  }, []);

  // Stable function: deactivate secure mode and update state
  const deactivate = useCallback(async () => {
    try {
      await disableSecureMode();
      setIsSecureModeEnabled(false);
    } catch (error) {
      if (__DEV__) {
        console.error('[useCaptureRestriction] Failed to disable:', error);
      }
    }
  }, []);

  useEffect(() => {
    // -----------------------------------------------------------------------
    // 1. Enable on mount
    // -----------------------------------------------------------------------
    activate();

    // -----------------------------------------------------------------------
    // 2. Listen to AppState changes — re-enable on foreground
    // -----------------------------------------------------------------------
    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        const previousState = appStateRef.current;
        appStateRef.current = nextState;

        // Re-enable when coming back to foreground
        if (
          (previousState === 'background' || previousState === 'inactive') &&
          nextState === 'active'
        ) {
          activate();
        }
      },
    );

    // -----------------------------------------------------------------------
    // 3. Subscribe to iOS screen capture events
    // -----------------------------------------------------------------------
    const unsubscribeCapture = onScreenCaptureChange((event) => {
      setIsScreenBeingCaptured(event.isCaptured);
    });

    // -----------------------------------------------------------------------
    // 4. Cleanup on unmount
    // -----------------------------------------------------------------------
    return () => {
      deactivate();
      appStateSubscription.remove();
      unsubscribeCapture();
    };
  }, [activate, deactivate]);

  return {
    isScreenBeingCaptured,
    isSecureModeEnabled,
  };
}
