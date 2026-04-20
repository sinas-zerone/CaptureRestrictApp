/**
 * SecureScreenWrapper — Security boundary component
 *
 * Wraps any screen content with screenshot/recording prevention.
 * On iOS, shows a privacy overlay when screen recording is detected.
 * On Android, FLAG_SECURE handles everything at the OS level.
 *
 * Performance optimizations:
 * - React.memo prevents re-renders when parent state changes but props haven't
 * - useMemo for overlay visibility computation
 * - StyleSheet.create for static styles (cached by RN runtime)
 */

import React, { useMemo } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useCaptureRestriction } from '../hooks/useCaptureRestriction';

interface SecureScreenWrapperProps {
  children: React.ReactNode;
  /** Optional: custom overlay component when capture is detected */
  captureOverlay?: React.ReactNode;
  /** Optional: enable/disable the wrapper (defaults to true) */
  enabled?: boolean;
}

function SecureScreenWrapperInner({
  children,
  captureOverlay,
  enabled = true,
}: SecureScreenWrapperProps): React.JSX.Element {
  const { isScreenBeingCaptured } = useCaptureRestriction();

  // Only show overlay on iOS when capture is actively happening
  const showOverlay = useMemo(
    () => enabled && isScreenBeingCaptured && Platform.OS === 'ios',
    [enabled, isScreenBeingCaptured],
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {children}
      {showOverlay && (
        <View style={styles.overlay}>
          {captureOverlay ?? (
            <View style={styles.defaultOverlay}>
              <Text style={styles.overlayIcon}>🔒</Text>
              <Text style={styles.overlayTitle}>Content Protected</Text>
              <Text style={styles.overlaySubtitle}>
                Screen recording has been detected.{'\n'}
                Content is hidden for your security.
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Memoized export — only re-renders if props actually change.
 * This is critical because this wrapper sits at the top of every screen.
 */
export const SecureScreenWrapper = React.memo(SecureScreenWrapperInner);
SecureScreenWrapper.displayName = 'SecureScreenWrapper';

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  defaultOverlay: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  overlayIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  overlaySubtitle: {
    fontSize: 14,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 20,
  },
});
