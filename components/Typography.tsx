import React from 'react';
import { Text, StyleSheet, TextProps, TextStyle } from 'react-native';
import { colors, textStyles } from '../theme';

export type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'body'
  | 'bodyLarge'
  | 'bodySmall'
  | 'label'
  | 'caption'
  | 'captionBold';

export type TypographyColor =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'white'
  | 'black';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: TypographyColor | string;
  align?: 'left' | 'center' | 'right' | 'justify';
  children: React.ReactNode;
  style?: TextStyle;
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'primary',
  align = 'left',
  children,
  style,
  ...props
}) => {
  const textColor = getColor(color);

  return (
    <Text
      style={[styles[variant], { color: textColor, textAlign: align }, style]}
      {...props}
    >
      {children}
    </Text>
  );
};

// Helper function to get color
const getColor = (color: TypographyColor | string): string => {
  const colorMap: Record<TypographyColor, string> = {
    primary: colors.primary[600],
    secondary: colors.secondary[500],
    accent: colors.accent[400],
    success: colors.semantic.success,
    warning: colors.semantic.warning,
    error: colors.semantic.error,
    white: colors.special.white,
    black: colors.neutral[900],
  };

  return colorMap[color as TypographyColor] || color;
};

// Individual Typography Components for convenience
export const Heading1: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h1" {...props} />
);

export const Heading2: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h2" {...props} />
);

export const Heading3: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h3" {...props} />
);

export const Heading4: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="h4" {...props} />
);

export const Body: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body" {...props} />
);

export const BodyLarge: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodyLarge" {...props} />
);

export const BodySmall: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="bodySmall" {...props} />
);

export const Label: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="label" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);

export const CaptionBold: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="captionBold" {...props} />
);

const styles = StyleSheet.create({
  h1: {
    ...textStyles.h1,
  },
  h2: {
    ...textStyles.h2,
  },
  h3: {
    ...textStyles.h3,
  },
  h4: {
    ...textStyles.h4,
  },
  body: {
    ...textStyles.body,
  },
  bodyLarge: {
    ...textStyles.bodyLarge,
  },
  bodySmall: {
    ...textStyles.bodySmall,
  },
  label: {
    ...textStyles.label,
  },
  caption: {
    ...textStyles.caption,
  },
  captionBold: {
    ...textStyles.captionBold,
  },
});
