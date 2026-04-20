/**
 * Jest Setup — Mock native modules and platform APIs
 *
 * This file runs before every test suite. We mock all native modules
 * that don't exist in the Jest JS environment.
 */

// ---------------------------------------------------------------------------
// Mock: NativeEventEmitter — Replace on the react-native module directly
// so it works regardless of import path
// ---------------------------------------------------------------------------
const mockSubscription = { remove: jest.fn() };

const MockNativeEventEmitter = jest.fn().mockImplementation(() => ({
  addListener: jest.fn(() => mockSubscription),
  removeAllListeners: jest.fn(),
  removeSubscription: jest.fn(),
  listenerCount: jest.fn(() => 0),
  emit: jest.fn(),
}));

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => MockNativeEventEmitter);

// ---------------------------------------------------------------------------
// Also patch it directly on the react-native module object for re-exports
// ---------------------------------------------------------------------------
const RN = require('react-native');
RN.NativeEventEmitter = MockNativeEventEmitter;

// ---------------------------------------------------------------------------
// Mock: CaptureRestrictModule (our custom native module)
// ---------------------------------------------------------------------------
RN.NativeModules.CaptureRestrictModule = {
  enableSecureMode: jest.fn(() => Promise.resolve()),
  disableSecureMode: jest.fn(() => Promise.resolve()),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

// ---------------------------------------------------------------------------
// Mock: react-native-screens (needed for @react-navigation/native-stack)
// ---------------------------------------------------------------------------
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: 'Screen',
  ScreenContainer: 'ScreenContainer',
  ScreenStack: 'ScreenStack',
  ScreenStackHeaderConfig: 'ScreenStackHeaderConfig',
  NativeScreen: 'NativeScreen',
  NativeScreenContainer: 'NativeScreenContainer',
  NativeScreenNavigationContainer: 'NativeScreenNavigationContainer',
  NativeScreenStack: 'NativeScreenStack',
  SearchBar: 'SearchBar',
  FullWindowOverlay: 'FullWindowOverlay',
}));

// ---------------------------------------------------------------------------
// Mock: @react-navigation/native-stack
// ---------------------------------------------------------------------------
jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }) => children,
      Screen: ({ children }) => children,
      Group: ({ children }) => children,
    }),
  };
});

// ---------------------------------------------------------------------------
// Mock: @react-navigation/native
// ---------------------------------------------------------------------------
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }) => children,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      dispatch: jest.fn(),
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
    createNavigatorFactory: jest.fn(),
  };
});

// ---------------------------------------------------------------------------
// Mock: react-native-safe-area-context
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => {
  const insets = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => insets,
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 375, height: 812 }),
  };
});

// ---------------------------------------------------------------------------
// Silence noisy warnings in test output
// ---------------------------------------------------------------------------
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Require cycle:')
  ) {
    return;
  }
  originalConsoleWarn(...args);
};
