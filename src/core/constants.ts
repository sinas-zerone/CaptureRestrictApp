/**
 * App-wide constants
 *
 * Centralizing magic strings and configuration values prevents
 * typos and makes refactoring trivial.
 */

// ---------------------------------------------------------------------------
// Performance Trace Names
// ---------------------------------------------------------------------------
export const TRACE_NAMES = {
  SCREEN_LOAD: 'screen_load',
  NETWORK_REQUEST: 'network_request',
  BACKGROUND_TASK: 'background_task',
} as const;

// ---------------------------------------------------------------------------
// Native Event Names (emitted from CaptureRestrictModule)
// ---------------------------------------------------------------------------
export const NATIVE_EVENTS = {
  SCREEN_CAPTURE_STATUS_CHANGE: 'onScreenCaptureStatusChange',
} as const;

// ---------------------------------------------------------------------------
// Performance Tracer Config
// ---------------------------------------------------------------------------
export const PERFORMANCE_CONFIG = {
  /** Maximum number of completed traces to keep in memory */
  MAX_TRACE_HISTORY: 100,
  /** Whether to log traces to console in __DEV__ mode */
  ENABLE_DEV_LOGGING: true,
} as const;

// ---------------------------------------------------------------------------
// App State Values (mirrors React Native AppState)
// ---------------------------------------------------------------------------
export const APP_STATES = {
  ACTIVE: 'active',
  BACKGROUND: 'background',
  INACTIVE: 'inactive',
} as const;
