import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, textStyles } from '../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused ? styles.inputWrapperFocused : undefined,
          error ? styles.inputWrapperError : undefined,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            inputStyle,
          ]}
          placeholderTextColor={colors.primary[300]}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...textInputProps}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

// Password Input with toggle visibility
export interface PasswordInputProps extends Omit<InputProps, 'secureTextEntry' | 'rightIcon'> {
  visibilityIcon?: React.ReactNode;
  visibilityOffIcon?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  visibilityIcon,
  visibilityOffIcon,
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => setIsVisible(!isVisible);

  return (
    <Input
      {...props}
      secureTextEntry={!isVisible}
      rightIcon={
        <TouchableOpacity onPress={toggleVisibility} style={styles.visibilityToggle}>
          {isVisible ? visibilityIcon : visibilityOffIcon}
        </TouchableOpacity>
      }
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...textStyles.label,
    color: colors.primary[600],
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderWidth: 2,
    borderColor: colors.primary[300],
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  inputWrapperFocused: {
    borderColor: colors.accent[400],
    backgroundColor: colors.special.white,
  },
  inputWrapperError: {
    borderColor: colors.semantic.error,
  },
  input: {
    flex: 1,
    padding: spacing.base,
    fontSize: textStyles.body.fontSize,
    color: colors.primary[600],
  },
  inputWithLeftIcon: {
    paddingLeft: spacing['3xl'] + spacing.base,
  },
  inputWithRightIcon: {
    paddingRight: spacing['3xl'] + spacing.base,
  },
  leftIcon: {
    position: 'absolute',
    left: spacing.base,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: spacing.base,
    zIndex: 1,
  },
  error: {
    ...textStyles.caption,
    color: colors.semantic.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  visibilityToggle: {
    padding: spacing.xs,
  },
});
