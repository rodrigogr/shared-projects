/**
 * App.tsx - Main entry point for Eu Meu Personal Training
 * Wraps app with WorkoutProvider and sets up navigation container
 * **Validates: Requirements 8.1**
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, Platform } from 'react-native';
import { WorkoutProvider } from './src/context/WorkoutContext';
import { AppNavigator } from './src/navigation/AppNavigator';

/**
 * Main App component
 * Sets up the app with:
 * - GestureHandlerRootView for gesture support
 * - SafeAreaProvider for safe area handling
 * - NavigationContainer for React Navigation
 * - WorkoutProvider for global state management
 */
export default function App(): React.ReactElement {
  // Fix scroll and layout issues on web
  useEffect(() => {
    if (Platform.OS === 'web') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          height: 100%;
          width: 100%;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
        #root > div {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <NavigationContainer>
          <WorkoutProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </WorkoutProvider>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
