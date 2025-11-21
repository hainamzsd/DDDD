/**
 * Color Palette extracted from LocationID Tracker Design
 * This palette follows the design system from the exported HTML
 */

export const colors = {
  // Primary Colors - Green (Forest/Dark Green for official/government theme)
  primary: {
    50: '#f0fdf4',    // Lightest green background
    100: '#dcfce7',   // Very light green
    200: '#bbf7d0',   // Light green gradient
    300: '#86efac',   // Medium light green
    400: '#4ade80',   // Medium green
    500: '#15803d',   // Primary green (main brand color)
    600: '#0f5132',   // Dark green (primary gradient start)
    700: '#145a3a',   // Dark green (primary gradient end)
    800: '#0d3b24',   // Very dark green
    900: '#082518',   // Darkest green
  },

  // Secondary Colors - Red (Alert/Action color)
  secondary: {
    50: '#fef2f2',    // Lightest red
    100: '#fee2e2',   // Very light red
    200: '#fecaca',   // Light red
    300: '#fca5a5',   // Medium light red
    400: '#f87171',   // Medium red
    500: '#dc2626',   // Primary red (main action color)
    600: '#b91c1c',   // Dark red (gradient end)
    700: '#991b1b',   // Very dark red
    800: '#7f1d1d',   // Darkest red
    900: '#450a0a',   // Almost black red
  },

  // Accent Colors - Yellow/Amber (Warning/Highlight)
  accent: {
    50: '#fffbeb',    // Lightest yellow
    100: '#fef3c7',   // Very light yellow
    200: '#fde68a',   // Light yellow
    300: '#fcd34d',   // Medium light yellow
    400: '#fbbf24',   // Primary yellow (badge/highlight color)
    500: '#f59e0b',   // Amber (gradient end)
    600: '#d97706',   // Dark amber
    700: '#b45309',   // Very dark amber
    800: '#92400e',   // Darkest amber
    900: '#78350f',   // Almost black amber (text on yellow)
  },

  // Neutral Colors - Gray (Text and backgrounds)
  neutral: {
    50: '#f9fafb',    // Almost white
    100: '#f1f5f9',   // Background color (main app background)
    200: '#e5e7eb',   // Light gray
    300: '#d1d5db',   // Border gray
    400: '#9ca3af',   // Medium gray
    500: '#6b7280',   // Text gray (secondary text)
    600: '#4b5563',   // Dark gray (labels)
    700: '#374151',   // Darker gray
    800: '#1f2937',   // Very dark gray (primary text)
    900: '#111827',   // Almost black
    950: '#171717',   // Phone frame black
  },

  // Background Gradients
  gradients: {
    // Main background gradient (warm light)
    background: {
      start: '#fef9f3',
      end: '#fef3e2',
    },
    // Primary green gradient (header, badges)
    primary: {
      start: '#0f5132',
      end: '#145a3a',
    },
    // Secondary red gradient (buttons, actions)
    secondary: {
      start: '#dc2626',
      end: '#b91c1c',
    },
    // Accent yellow gradient (badges, highlights)
    accent: {
      start: '#fbbf24',
      end: '#f59e0b',
    },
    // Light green gradient (survey icons)
    lightGreen: {
      start: '#dcfce7',
      end: '#bbf7d0',
    },
  },

  // Chart/Data Visualization Colors
  chart: {
    // Photo/Media colors
    photo: ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981'],
    // Data colors
    data: ['#fbbf24', '#15803d', '#dc2626', '#3b82f6', '#f59e0b'],
  },

  // Success Colors - Green (same as primary for consistency)
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#15803d',
    600: '#0f5132',
    700: '#145a3a',
    800: '#0d3b24',
    900: '#082518',
  },

  // Warning Colors - Yellow/Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },

  // Error Colors - Red
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#dc2626',
    600: '#b91c1c',
    700: '#991b1b',
    800: '#7f1d1d',
    900: '#450a0a',
  },

  // Info Colors - Blue
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Semantic Colors (for backward compatibility)
  semantic: {
    success: '#15803d',    // Green for success states
    warning: '#fbbf24',    // Yellow for warnings
    error: '#dc2626',      // Red for errors
    info: '#3b82f6',       // Blue for info
  },

  // Special Colors
  special: {
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
    // Overlay colors
    overlay: {
      light: 'rgba(255, 255, 255, 0.15)',
      dark: 'rgba(0, 0, 0, 0.5)',
    },
    // Glass effect
    glass: {
      background: 'rgba(255, 255, 255, 0.15)',
      border: 'rgba(255, 255, 255, 0.3)',
    },
  },
};

// Export commonly used color combinations
export const colorPairs = {
  // Text on backgrounds
  text: {
    onPrimary: colors.special.white,
    onSecondary: colors.special.white,
    onAccent: colors.accent[900],
    onLight: colors.neutral[800],
    onDark: colors.special.white,
  },

  // Border colors
  border: {
    primary: colors.primary[300],
    light: colors.primary[200],
    accent: colors.accent[400],
    neutral: colors.neutral[300],
    success: colors.success[300],
    warning: colors.warning[300],
    error: colors.error[300],
    info: colors.info[300],
  },

  // Shadow colors (for consistency)
  shadow: {
    primary: 'rgba(15, 81, 50, 0.2)',
    secondary: 'rgba(220, 38, 38, 0.3)',
    accent: 'rgba(251, 191, 36, 0.3)',
    neutral: 'rgba(0, 0, 0, 0.08)',
  },
};

export type Colors = typeof colors;
export type ColorPairs = typeof colorPairs;
