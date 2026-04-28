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
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
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
        <ThemeProvider>
          <WorkoutProvider>
            <ThemedAppShell />
          </WorkoutProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Inner shell that has access to the active theme so it can drive the status
 * bar and navigation container background.
 */
function ThemedAppShell(): React.ReactElement {
  const { effectiveMode, colors } = useTheme();
  return (
    <NavigationContainer
      theme={{
        dark: effectiveMode === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <StatusBar style={effectiveMode === 'dark' ? 'light' : 'dark'} />
      <AppNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
