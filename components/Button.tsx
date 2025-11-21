import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  onPress,
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`${size}Size`],
    fullWidth ? styles.fullWidth : undefined,
    disabled ? styles.disabled : undefined,
    style,
  ];

  const textStyleCombined = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled ? styles.disabledText : undefined,
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={
            variant === 'outline' || variant === 'ghost'
              ? colors.primary[500]
              : colors.special.white
          }
        />
      );
    }

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <View style={styles.iconLeft}>{icon}</View>
        )}
        <Text style={textStyleCombined}>{children}</Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.iconRight}>{icon}</View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={buttonStyle}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius['2xl'],
    ...shadows.secondary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },

  // Variants
  primary: {
    backgroundColor: colors.secondary[500],
  },
  secondary: {
    backgroundColor: colors.primary[600],
    ...shadows.primary,
  },
  outline: {
    backgroundColor: colors.special.transparent,
    borderWidth: 2,
    borderColor: colors.primary[500],
    ...shadows.sm,
  },
  ghost: {
    backgroundColor: colors.special.transparent,
  },

  // Sizes
  smallSize: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  mediumSize: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.lg,
  },
  largeSize: {
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing.xl,
  },

  // Text Styles
  text: {
    ...textStyles.button,
    textAlign: 'center',
  },
  primaryText: {
    color: colors.special.white,
  },
  secondaryText: {
    color: colors.special.white,
  },
  outlineText: {
    color: colors.primary[600],
  },
  ghostText: {
    color: colors.primary[600],
  },

  // Text Sizes
  smallText: {
    ...textStyles.buttonSmall,
  },
  mediumText: {
    fontSize: textStyles.button.fontSize,
  },
  largeText: {
    fontSize: textStyles.button.fontSize + 2,
  },

  // Disabled State
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    opacity: 0.7,
  },

  // Icons
  iconLeft: {
    marginRight: spacing.md,
  },
  iconRight: {
    marginLeft: spacing.md,
  },
});
