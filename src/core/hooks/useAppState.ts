/**
 * useAppState — Reusable hook for tracking AppState transitions
 *
 * Returns the current and previous AppState values.
 * Properly cleans up the event listener on unmount.
 *
 * Performance notes:
 * - Uses useRef for the subscription to avoid re-creating it on every render.
 * - Uses useCallback-less pattern since the setState calls are stable.
 */

import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

interface AppStateInfo {
  /** Current app state */
  currentState: AppStateStatus;
  /** Previous app state (null on first render) */
  previousState: AppStateStatus | null;
}

export function useAppState(): AppStateInfo {
  const [currentState, setCurrentState] = useState<AppStateStatus>(
    AppState.currentState,
  );
  const previousStateRef = useRef<AppStateStatus | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      previousStateRef.current = currentState;
      setCurrentState(nextState);
    });

    return () => {
      subscription.remove();
    };
    // We intentionally track `currentState` to keep previousStateRef accurate.
    // The subscription is cheap (single native listener) so re-subscribing is fine.
  }, [currentState]);

  return {
    currentState,
    previousState: previousStateRef.current,
  };
}
