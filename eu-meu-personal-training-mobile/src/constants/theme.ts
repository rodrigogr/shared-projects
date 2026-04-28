/**
 * Theme constants for Eu Meu Personal Training
 *
 * Provides light and dark color palettes plus shared design tokens. New code
 * should consume the active palette via `useTheme()` from
 * `src/context/ThemeContext`. The legacy `COLORS` export is kept as the LIGHT
 * palette so screens not yet migrated keep rendering correctly.
 */

export interface ThemePalette {
  // Brand
  primary: string;
  primaryDark: string;
  secondary: string;

  // Surfaces
  background: string;
  surface: string;
  surfaceAlt: string;
  white: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  placeholder: string;

  // Accent
  accent: string;

  // Semantic
  danger: string;
  success: string;
  warning: string;
  info: string;

  // Palette used to color workout cards (supports many custom workouts)
  cardPalette: string[];

  // Legacy aliases (kept so existing screens don't break)
  cardA: string;
  cardB: string;
  cardC: string;
  cardD: string;

  // Section colors
  warmup: string;
  stretch: string;
  exercise: string;

  // Borders / dividers
  border: string;
  divider: string;

  // Overlays
  overlay: string;
  cardOverlay: string;

  // Status bar style hint
  statusBarStyle: 'light' | 'dark';
}

const sharedCardPalette = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#EC4899', // Pink
  '#14B8A6', // Teal
];

export const lightColors: ThemePalette = {
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  secondary: '#10B981',

  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F3F4F6',
  white: '#FFFFFF',

  text: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',
  placeholder: '#9CA3AF',

  accent: '#F59E0B',

  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#3B82F6',

  cardPalette: sharedCardPalette,
  cardA: sharedCardPalette[0],
  cardB: sharedCardPalette[1],
  cardC: sharedCardPalette[2],
  cardD: sharedCardPalette[3],

  warmup: '#F59E0B',
  stretch: '#8B5CF6',
  exercise: '#4F46E5',

  border: '#E5E7EB',
  divider: '#D1D5DB',

  overlay: 'rgba(0, 0, 0, 0.5)',
  cardOverlay: 'rgba(255, 255, 255, 0.2)',

  statusBarStyle: 'light',
};

export const darkColors: ThemePalette = {
  primary: '#6366F1',
  primaryDark: '#4338CA',
  secondary: '#34D399',

  background: '#0F172A',
  surface: '#1E293B',
  surfaceAlt: '#334155',
  white: '#FFFFFF',

  text: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',
  placeholder: '#64748B',

  accent: '#FBBF24',

  danger: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  info: '#60A5FA',

  cardPalette: sharedCardPalette,
  cardA: sharedCardPalette[0],
  cardB: sharedCardPalette[1],
  cardC: sharedCardPalette[2],
  cardD: sharedCardPalette[3],

  warmup: '#FBBF24',
  stretch: '#A78BFA',
  exercise: '#818CF8',

  border: '#334155',
  divider: '#475569',

  overlay: 'rgba(0, 0, 0, 0.7)',
  cardOverlay: 'rgba(255, 255, 255, 0.08)',

  statusBarStyle: 'light',
};

/**
 * Backward-compatible export. Kept as the LIGHT palette so components that
 * still import `COLORS` directly continue to work.
 */
export const COLORS: ThemePalette = lightColors;

/**
 * Picks a deterministic palette color from a string seed (e.g. workout id).
 */
export function pickPaletteColor(seed: string, palette: string[] = sharedCardPalette): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}

/**
 * Spacing constants for consistent layout
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

/**
 * Border radius constants
 */
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;

/**
 * Font sizes
 */
export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  title: 28,
  hero: 48,
} as const;

/**
 * Touch target sizes (minimum 44x44 for accessibility)
 */
export const TOUCH_TARGETS = {
  minimum: 44,
  small: 36,
  medium: 44,
  large: 56,
} as const;

/**
 * Shadow presets for elevation
 */
export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
} as const;

export default {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  TOUCH_TARGETS,
  SHADOWS,
};
