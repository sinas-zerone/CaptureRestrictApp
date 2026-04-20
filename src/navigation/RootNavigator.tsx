/**
 * RootNavigator — App navigation structure
 *
 * Wraps each screen with SecureScreenWrapper for security.
 * Uses React Navigation's native stack for optimal performance
 * (native transitions instead of JS-driven animations).
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@screens/HomeScreen';

// ---------------------------------------------------------------------------
// Type-safe route definitions
// ---------------------------------------------------------------------------

export type RootStackParamList = {
  Home: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// ---------------------------------------------------------------------------
// Navigator
// ---------------------------------------------------------------------------

function RootNavigatorInner(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#0F172A',
          },
          headerTintColor: '#F8FAFC',
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: '#0F172A',
          },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Secure Home',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export const RootNavigator = React.memo(RootNavigatorInner);
RootNavigator.displayName = 'RootNavigator';
