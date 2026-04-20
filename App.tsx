/**
 * App Entry Point
 *
 * Wraps the app with providers and security infrastructure.
 * The SecureScreenWrapper at the navigation level ensures
 * ALL screens are protected by default.
 */

import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#0F172A"
      />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;
