/**
 * SecureScreenWrapper — Component Tests
 *
 * Tests:
 * - Renders children when no capture is detected
 * - Shows privacy overlay when screen capture is active (iOS)
 * - Respects the `enabled` prop
 * - Accepts custom overlay component
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { SecureScreenWrapper } from '../components/SecureScreenWrapper';

// ---------------------------------------------------------------------------
// Mock the useCaptureRestriction hook
// ---------------------------------------------------------------------------
const mockCaptureState = {
  isScreenBeingCaptured: false,
  isSecureModeEnabled: true,
};

jest.mock('../hooks/useCaptureRestriction', () => ({
  useCaptureRestriction: () => mockCaptureState,
}));

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
import { Text } from 'react-native';

const TestChild = () => <Text>Protected Content</Text>;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SecureScreenWrapper', () => {
  beforeEach(() => {
    mockCaptureState.isScreenBeingCaptured = false;
    mockCaptureState.isSecureModeEnabled = true;
  });

  it('renders children when screen is not being captured', () => {
    render(
      <SecureScreenWrapper>
        <TestChild />
      </SecureScreenWrapper>,
    );

    expect(screen.getByText('Protected Content')).toBeTruthy();
  });

  it('does not show overlay when capture is not detected', () => {
    render(
      <SecureScreenWrapper>
        <TestChild />
      </SecureScreenWrapper>,
    );

    expect(screen.queryByText('Content Protected')).toBeNull();
  });

  it('shows privacy overlay when screen capture is detected on iOS', () => {
    // Set platform to iOS
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'ios', configurable: true });

    mockCaptureState.isScreenBeingCaptured = true;

    render(
      <SecureScreenWrapper>
        <TestChild />
      </SecureScreenWrapper>,
    );

    expect(screen.getByText('Content Protected')).toBeTruthy();
    expect(screen.getByText(/Screen recording has been detected/)).toBeTruthy();

    // Restore platform
    Object.defineProperty(Platform, 'OS', { get: () => originalPlatform, configurable: true });
  });

  it('does not show overlay on Android even when capture is detected', () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'android', configurable: true });

    mockCaptureState.isScreenBeingCaptured = true;

    render(
      <SecureScreenWrapper>
        <TestChild />
      </SecureScreenWrapper>,
    );

    // On Android, FLAG_SECURE handles everything natively — no JS overlay needed
    expect(screen.queryByText('Content Protected')).toBeNull();
    expect(screen.getByText('Protected Content')).toBeTruthy();

    Object.defineProperty(Platform, 'OS', { get: () => originalPlatform, configurable: true });
  });

  it('renders children without security when enabled=false', () => {
    render(
      <SecureScreenWrapper enabled={false}>
        <TestChild />
      </SecureScreenWrapper>,
    );

    expect(screen.getByText('Protected Content')).toBeTruthy();
    expect(screen.queryByText('Content Protected')).toBeNull();
  });

  it('renders custom overlay when provided', () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'ios', configurable: true });

    mockCaptureState.isScreenBeingCaptured = true;

    const CustomOverlay = () => <Text>Custom Security Message</Text>;

    render(
      <SecureScreenWrapper captureOverlay={<CustomOverlay />}>
        <TestChild />
      </SecureScreenWrapper>,
    );

    expect(screen.getByText('Custom Security Message')).toBeTruthy();
    // Default overlay text should NOT appear
    expect(screen.queryByText('Content Protected')).toBeNull();

    Object.defineProperty(Platform, 'OS', { get: () => originalPlatform, configurable: true });
  });

  it('still renders children underneath the overlay', () => {
    const originalPlatform = Platform.OS;
    Object.defineProperty(Platform, 'OS', { get: () => 'ios', configurable: true });

    mockCaptureState.isScreenBeingCaptured = true;

    render(
      <SecureScreenWrapper>
        <TestChild />
      </SecureScreenWrapper>,
    );

    // Children should still be in the tree (overlay covers them visually)
    expect(screen.getByText('Protected Content')).toBeTruthy();

    Object.defineProperty(Platform, 'OS', { get: () => originalPlatform, configurable: true });
  });
});
