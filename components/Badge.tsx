import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large' | number;

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  icon,
  style,
  textStyle,
}) => {
  // If size is a number, use CircularBadge instead
  if (typeof size === 'number') {
    const variantColors: Record<BadgeVariant, string> = {
      primary: colors.primary[500],
      secondary: colors.secondary[500],
      accent: colors.accent[400],
      success: colors.semantic.success,
      warning: colors.accent[400],
      error: colors.semantic.error,
      info: colors.semantic.info,
    };

    return (
      <CircularBadge size={size} backgroundColor={variantColors[variant]} style={style}>
        {children}
      </CircularBadge>
    );
  }

  return (
    <View style={[styles.base, styles[variant], styles[`${size}Size`], style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.text, styles[`${variant}Text`], styles[`${size}Text`], textStyle]}>
        {children}
      </Text>
    </View>
  );
};

// Circular Badge for Icons (like the shield badge)
export interface CircularBadgeProps {
  children: React.ReactNode;
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
  style?: ViewStyle;
}

export const CircularBadge: React.FC<CircularBadgeProps> = ({
  children,
  size = 48,
  backgroundColor = colors.special.white,
  iconColor = colors.secondary[500],
  style,
}) => {
  return (
    <View
      style={[
        styles.circularBase,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: borderRadius.xl,
    ...shadows.accent,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary[500],
  },
  secondary: {
    backgroundColor: colors.secondary[500],
  },
  accent: {
    backgroundColor: colors.accent[400],
  },
  success: {
    backgroundColor: colors.semantic.success,
  },
  warning: {
    backgroundColor: colors.accent[400],
  },
  error: {
    backgroundColor: colors.semantic.error,
  },
  info: {
    backgroundColor: colors.semantic.info,
  },

  // Sizes
  smallSize: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  mediumSize: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  largeSize: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },

  // Text
  text: {
    ...textStyles.captionBold,
    textTransform: 'uppercase',
  },
  primaryText: {
    color: colors.special.white,
  },
  secondaryText: {
    color: colors.special.white,
  },
  accentText: {
    color: colors.accent[900],
  },
  successText: {
    color: colors.special.white,
  },
  warningText: {
    color: colors.accent[900],
  },
  errorText: {
    color: colors.special.white,
  },
  infoText: {
    color: colors.special.white,
  },

  // Text Sizes
  smallText: {
    fontSize: 10,
  },
  mediumText: {
    fontSize: textStyles.caption.fontSize,
  },
  largeText: {
    fontSize: textStyles.bodySmall.fontSize,
  },

  // Icon
  icon: {
    marginRight: spacing.xs,
  },

  // Circular Badge
  circularBase: {
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
  },
});
