import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';
import { CircularBadge } from './Badge';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  badgeIcon?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  badgeIcon,
  rightAction,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftSection}>
        {badgeIcon && (
          <CircularBadge size={48} style={styles.badge}>
            {badgeIcon}
          </CircularBadge>
        )}
        <View style={styles.textContainer}>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
      </View>
      {rightAction && <View style={styles.rightSection}>{rightAction}</View>}
    </View>
  );
};

// Settings Button Component (commonly used in header)
export interface SettingsButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
}

export const SettingsButton: React.FC<SettingsButtonProps> = ({ onPress, icon }) => {
  return (
    <TouchableOpacity style={styles.settingsButton} onPress={onPress} activeOpacity={0.7}>
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary[600],
    padding: spacing.lg,
    borderRadius: borderRadius['2xl'],
    ...shadows.primary,
    marginBottom: spacing['2xl'],
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
  },
  badge: {
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.accent[400],
    fontWeight: '600',
    marginBottom: spacing.xs / 2,
  },
  title: {
    ...textStyles.h4,
    color: colors.special.white,
    fontWeight: '700',
  },
  rightSection: {
    marginLeft: spacing.md,
  },
  settingsButton: {
    backgroundColor: colors.special.glass.background,
    borderWidth: 1,
    borderColor: colors.special.glass.border,
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
