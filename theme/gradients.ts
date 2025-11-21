/**
 * Gradient Definitions
 * React Native-friendly gradient configurations for expo-linear-gradient
 */

import { colors } from './colors';

/**
 * Gradient configurations matching the HTML design mockups
 * Each gradient includes colors array and default start/end positions
 */
export const gradients = {
  // Primary green gradient (dark green → lighter green)
  // Used in: Headers, hero sections, badges
  primary: {
    colors: [colors.gradients.primary.start, colors.gradients.primary.end],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Secondary red gradient
  // Used in: Action buttons, alerts
  secondary: {
    colors: [colors.gradients.secondary.start, colors.gradients.secondary.end],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Accent yellow gradient
  // Used in: Badges, highlights, warnings
  accent: {
    colors: [colors.gradients.accent.start, colors.gradients.accent.end],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Light green gradient
  // Used in: Survey icons, subtle backgrounds
  lightGreen: {
    colors: [colors.gradients.lightGreen.start, colors.gradients.lightGreen.end],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Background gradient (warm light)
  // Used in: Main app background behind cards
  background: {
    colors: [colors.gradients.background.start, colors.gradients.background.end],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
  },

  // Hero gradient (for login/splash screens)
  // Darker green gradient for hero sections
  hero: {
    colors: [colors.primary[700], colors.primary[600], colors.primary[500]],
    start: { x: 0, y: 0 },
    end: { x: 0, y: 1 },
    locations: [0, 0.5, 1],
  },

  // Button gradient (strong gradient for primary buttons)
  button: {
    colors: [colors.primary[600], colors.primary[700]],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 0 },
  },

  // Success gradient
  success: {
    colors: [colors.success[500], colors.success[600]],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Warning gradient
  warning: {
    colors: [colors.warning[400], colors.warning[500]],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },

  // Error gradient
  error: {
    colors: [colors.error[500], colors.error[600]],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  },
};

export type Gradients = typeof gradients;
