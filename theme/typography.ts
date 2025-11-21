/**
 * Typography System
 * Font sizes, weights, and line heights from the design
 */

export const typography = {
  // Font Families
  fontFamily: {
    primary: 'System',
    ios: '-apple-system, BlinkMacSystemFont',
    android: 'Roboto',
  },

  // Font Sizes (in rem units from design, converted to px for React Native)
  fontSize: {
    xs: 12,      // 0.75rem - small badges, helper text
    sm: 14,      // 0.875rem - body small, labels
    base: 16,    // 1rem - base body text
    lg: 18,      // 1.125rem - large body, button text
    xl: 20,      // 1.25rem - subheadings
    '2xl': 24,   // 1.5rem - section headings
    '3xl': 30,   // 1.875rem - main headings
    '4xl': 40,   // 2.5rem - hero headings
  },

  // Font Weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter Spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
  },
};

// Text Style Presets
// Updated to match README.md UI/UX requirements:
// - H1/H2: 20-24px bold
// - H3: 16-18px semi-bold
// - Body: 14-16px
// - Labels/chips: 12-14px
export const textStyles = {
  // Headings
  h1: {
    fontSize: 24, // 24px - large headers
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h2: {
    fontSize: 20, // 20px - section headers
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.tight,
  },
  h3: {
    fontSize: 18, // 18px - subsection headers (16-18px range)
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  h4: {
    fontSize: 16, // 16px - small headers
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },

  // Body Text (14-16px range per README)
  body: {
    fontSize: 16, // 16px - standard body text
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },
  bodyLarge: {
    fontSize: 16, // 16px - larger body text
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.relaxed, // More comfortable for reading
  },
  bodySmall: {
    fontSize: 14, // 14px - smaller body text
    fontWeight: typography.fontWeight.normal,
    lineHeight: typography.lineHeight.normal,
  },

  // Labels & Captions (12-14px range per README)
  label: {
    fontSize: 14, // 14px - standard labels
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  labelLarge: {
    fontSize: 14, // 14px - larger labels
    fontWeight: typography.fontWeight.semibold,
    lineHeight: typography.lineHeight.normal,
  },
  caption: {
    fontSize: 12, // 12px - captions, chips, badges
    fontWeight: typography.fontWeight.medium,
    lineHeight: typography.lineHeight.normal,
  },
  captionBold: {
    fontSize: 12, // 12px - bold captions
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.normal,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase' as const,
  },

  // Buttons
  button: {
    fontSize: 16, // 16px - primary button text (readable, not too large)
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.normal,
  },
  buttonSmall: {
    fontSize: 14, // 14px - secondary/tertiary button text
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.lineHeight.normal,
  },
};

export type Typography = typeof typography;
export type TextStyles = typeof textStyles;
