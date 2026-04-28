/**
 * ThemeContext - Provides the active color palette and theme mode (light /
 * dark / system) to the rest of the app, with persistence via AsyncStorage.
 *
 * Usage:
 *   const { colors, mode, effectiveMode, setMode, toggle } = useTheme();
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemePalette, darkColors, lightColors } from '../constants/theme';

export type ThemeMode = 'light' | 'dark' | 'system';
export type EffectiveThemeMode = 'light' | 'dark';

const STORAGE_KEY = '@eu_meu_personal_training:theme_mode';

interface ThemeContextValue {
  /** Active palette (already resolved against system preference). */
  colors: ThemePalette;
  /** User selected mode (may be 'system'). */
  mode: ThemeMode;
  /** Resolved mode actually being rendered ('light' or 'dark'). */
  effectiveMode: EffectiveThemeMode;
  /** Persist a new mode preference. */
  setMode: (mode: ThemeMode) => void;
  /** Convenience: cycles light → dark → system → light. */
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

function resolveMode(mode: ThemeMode, system: ColorSchemeName): EffectiveThemeMode {
  if (mode === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

export function ThemeProvider({ children }: ThemeProviderProps): React.ReactElement {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Load persisted preference once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setModeState(stored);
        }
      } catch {
        // Ignore — fall back to system default
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // React to OS-level appearance changes when in 'system' mode
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme);
    });
    return () => subscription.remove();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
      // Best-effort persistence
    });
  }, []);

  const toggle = useCallback(() => {
    setModeState((current) => {
      const next: ThemeMode =
        current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {
        /* noop */
      });
      return next;
    });
  }, []);

  const effectiveMode = resolveMode(mode, systemScheme);
  const colors = effectiveMode === 'dark' ? darkColors : lightColors;

  const value = useMemo<ThemeContextValue>(
    () => ({ colors, mode, effectiveMode, setMode, toggle }),
    [colors, mode, effectiveMode, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
