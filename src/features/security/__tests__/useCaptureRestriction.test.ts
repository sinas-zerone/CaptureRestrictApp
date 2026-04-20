/**
 * useCaptureRestriction — Unit Tests
 *
 * Tests the core security hook that orchestrates:
 * - Native module calls (enableSecureMode / disableSecureMode)
 * - AppState lifecycle handling (foreground re-enable)
 * - iOS screen capture event subscription
 * - Proper cleanup on unmount
 *
 * We mock the entire native bridge module to isolate hook logic.
 */

import { renderHook, act } from '@testing-library/react-native';
import { AppState } from 'react-native';

// ---------------------------------------------------------------------------
// Mock the native bridge module — this avoids NativeEventEmitter issues
// and lets us control exactly what the hook receives.
// ---------------------------------------------------------------------------
const mockEnableSecureMode = jest.fn(() => Promise.resolve());
const mockDisableSecureMode = jest.fn(() => Promise.resolve());
const mockOnScreenCaptureChange = jest.fn(() => jest.fn()); // returns unsubscribe fn

jest.mock('../native/CaptureRestrictModule', () => ({
  enableSecureMode: (...args: unknown[]) => mockEnableSecureMode(...args),
  disableSecureMode: (...args: unknown[]) => mockDisableSecureMode(...args),
  onScreenCaptureChange: (...args: unknown[]) => mockOnScreenCaptureChange(...args),
  __resetForTesting: jest.fn(),
}));

import { useCaptureRestriction } from '../hooks/useCaptureRestriction';

// ---------------------------------------------------------------------------
// AppState mock helpers
// ---------------------------------------------------------------------------
let appStateChangeHandler: ((state: string) => void) | null = null;
const mockRemove = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  appStateChangeHandler = null;

  // Reset mock implementations
  mockEnableSecureMode.mockImplementation(() => Promise.resolve());
  mockDisableSecureMode.mockImplementation(() => Promise.resolve());
  mockOnScreenCaptureChange.mockImplementation(() => jest.fn());

  // Mock AppState.addEventListener to capture the handler
  jest.spyOn(AppState, 'addEventListener').mockImplementation(
    (type: string, handler: any) => {
      if (type === 'change') {
        appStateChangeHandler = handler;
      }
      return { remove: mockRemove } as any;
    },
  );

  // Default AppState
  Object.defineProperty(AppState, 'currentState', {
    get: () => 'active',
    configurable: true,
  });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useCaptureRestriction', () => {
  it('calls enableSecureMode on mount', async () => {
    renderHook(() => useCaptureRestriction());

    await act(async () => {});

    expect(mockEnableSecureMode).toHaveBeenCalledTimes(1);
  });

  it('calls disableSecureMode on unmount', async () => {
    const { unmount } = renderHook(() => useCaptureRestriction());

    await act(async () => {});

    // Reset to track only the unmount call
    mockDisableSecureMode.mockClear();

    unmount();

    await act(async () => {});

    expect(mockDisableSecureMode).toHaveBeenCalledTimes(1);
  });

  it('subscribes to AppState changes', async () => {
    renderHook(() => useCaptureRestriction());

    await act(async () => {});

    expect(AppState.addEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });

  it('subscribes to screen capture change events', async () => {
    renderHook(() => useCaptureRestriction());

    await act(async () => {});

    expect(mockOnScreenCaptureChange).toHaveBeenCalledWith(
      expect.any(Function),
    );
  });

  it('re-enables secure mode when app returns to foreground from background', async () => {
    renderHook(() => useCaptureRestriction());

    await act(async () => {});

    // Initial mount call
    expect(mockEnableSecureMode).toHaveBeenCalledTimes(1);

    // Simulate: app goes to background
    await act(async () => {
      appStateChangeHandler?.('background');
    });

    // Simulate: app returns to foreground
    mockEnableSecureMode.mockClear();
    await act(async () => {
      appStateChangeHandler?.('active');
    });

    expect(mockEnableSecureMode).toHaveBeenCalledTimes(1);
  });

  it('re-enables secure mode when app returns from inactive state', async () => {
    renderHook(() => useCaptureRestriction());

    await act(async () => {});

    mockEnableSecureMode.mockClear();

    // Simulate: inactive -> active
    await act(async () => {
      appStateChangeHandler?.('inactive');
    });

    await act(async () => {
      appStateChangeHandler?.('active');
    });

    expect(mockEnableSecureMode).toHaveBeenCalled();
  });

  it('cleans up AppState subscription on unmount', async () => {
    const { unmount } = renderHook(() => useCaptureRestriction());

    await act(async () => {});

    unmount();

    expect(mockRemove).toHaveBeenCalled();
  });

  it('cleans up screen capture subscription on unmount', async () => {
    const mockUnsubscribe = jest.fn();
    mockOnScreenCaptureChange.mockImplementation(() => mockUnsubscribe);

    const { unmount } = renderHook(() => useCaptureRestriction());

    await act(async () => {});

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('returns initial state with capture not detected', async () => {
    const { result } = renderHook(() => useCaptureRestriction());

    await act(async () => {});

    expect(result.current.isScreenBeingCaptured).toBe(false);
    expect(result.current.isSecureModeEnabled).toBe(true);
  });

  it('handles enableSecureMode failure gracefully', async () => {
    mockEnableSecureMode.mockRejectedValueOnce(new Error('Test error'));

    // Should not throw
    const { result } = renderHook(() => useCaptureRestriction());

    await act(async () => {});

    // State should reflect failure
    expect(result.current.isSecureModeEnabled).toBe(false);
  });

  it('handles disableSecureMode failure gracefully on unmount', async () => {
    const { unmount } = renderHook(() => useCaptureRestriction());

    await act(async () => {});

    mockDisableSecureMode.mockRejectedValueOnce(new Error('Test error'));

    // Should not throw on unmount
    expect(() => unmount()).not.toThrow();
  });

  it('updates isScreenBeingCaptured when capture event fires', async () => {
    // Capture the callback passed to onScreenCaptureChange
    let captureCallback: ((event: { isCaptured: boolean }) => void) | null = null;
    mockOnScreenCaptureChange.mockImplementation((cb: any) => {
      captureCallback = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useCaptureRestriction());

    await act(async () => {});

    expect(result.current.isScreenBeingCaptured).toBe(false);

    // Simulate capture event
    await act(async () => {
      captureCallback?.({ isCaptured: true });
    });

    expect(result.current.isScreenBeingCaptured).toBe(true);

    // Simulate capture ended
    await act(async () => {
      captureCallback?.({ isCaptured: false });
    });

    expect(result.current.isScreenBeingCaptured).toBe(false);
  });
});
