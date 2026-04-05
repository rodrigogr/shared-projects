/**
 * Theme constants for Eu Meu Personal Training
 * Centralized color scheme and styling constants
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */

/**
 * Color palette from design document
 */
export const COLORS = {
  // Primary colors
  primary: '#4F46E5',      // Indigo - main brand color
  secondary: '#10B981',    // Emerald - success/positive actions
  
  // Background colors
  background: '#F9FAFB',   // Light Gray - main background
  white: '#FFFFFF',
  
  // Text colors
  text: '#1F2937',         // Dark Gray - primary text
  textSecondary: '#6B7280', // Medium Gray - secondary text
  textMuted: '#9CA3AF',    // Light Gray - muted/placeholder text
  
  // Accent colors
  accent: '#F59E0B',       // Amber - highlights and warmup
  
  // Semantic colors
  danger: '#EF4444',       // Red - destructive actions
  success: '#10B981',      // Green - success states
  warning: '#F59E0B',      // Amber - warning states
  info: '#3B82F6',         // Blue - info states
  
  // Workout category colors
  cardA: '#4F46E5',        // Indigo
  cardB: '#10B981',        // Emerald
  cardC: '#F59E0B',        // Amber
  cardD: '#EF4444',        // Red
  
  // Section colors
  warmup: '#F59E0B',       // Amber
  stretch: '#8B5CF6',      // Purple
  exercise: '#4F46E5',     // Indigo
  
  // Border and divider colors
  border: '#E5E7EB',
  divider: '#D1D5DB',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.5)',
  cardOverlay: 'rgba(255, 255, 255, 0.2)',
} as const;

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
