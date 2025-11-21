/**
 * Theme Configuration
 * Central export for all theme-related values
 */

export { colors, colorPairs } from './colors';
export { typography, textStyles } from './typography';
export { spacing, borderRadius, shadows } from './spacing';
export { gradients } from './gradients';

import { colors, colorPairs } from './colors';
import { typography, textStyles } from './typography';
import { spacing, borderRadius, shadows } from './spacing';
import { gradients } from './gradients';

// Combined theme object
export const theme = {
  colors,
  colorPairs,
  typography,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  gradients,
};

export type Theme = typeof theme;
