/**
 * useScreenLoadTrace — Track how long a screen takes to become interactive
 *
 * Starts a performance trace on mount and stops it after all pending
 * interactions (animations, layout) have completed.
 *
 * Uses InteractionManager.runAfterInteractions to ensure we measure
 * the *real* time-to-interactive, not just mount time.
 *
 * Usage:
 *   function MyScreen() {
 *     useScreenLoadTrace('MyScreen');
 *     return <View>...</View>;
 *   }
 */

import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { PerformanceTracer } from './PerformanceTracer';
import { TRACE_NAMES } from '@core/constants';

export function useScreenLoadTrace(screenName: string): void {
  // useRef ensures we only trace once per mount, even in StrictMode
  const hasTracedRef = useRef(false);

  useEffect(() => {
    if (hasTracedRef.current) return;
    hasTracedRef.current = true;

    const traceName = `${TRACE_NAMES.SCREEN_LOAD}:${screenName}`;
    PerformanceTracer.startTrace(traceName, { screen: screenName });

    // runAfterInteractions fires after all animations and layout passes
    const handle = InteractionManager.runAfterInteractions(() => {
      PerformanceTracer.stopTrace(traceName);
    });

    return () => {
      handle.cancel();
      // If the component unmounts before interactions finish,
      // stop the trace to avoid orphaned entries
      PerformanceTracer.stopTrace(traceName);
    };
  }, [screenName]);
}
