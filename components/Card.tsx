import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, borderRadius, shadows, textStyles } from '../theme';

export interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, onPress, style, elevated = true }) => {
  const cardStyle = [styles.card, elevated && shadows.sm, style];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// Survey Item Card (specific to the design)
export interface SurveyCardProps {
  surveyId: string;
  date: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export const SurveyCard: React.FC<SurveyCardProps> = ({
  surveyId,
  date,
  icon,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity style={[styles.surveyCard, style]} onPress={onPress} activeOpacity={0.7}>
      {icon && <View style={styles.surveyIcon}>{icon}</View>}
      <View style={styles.surveyInfo}>
        <Text style={styles.surveyId}>{surveyId}</Text>
        <Text style={styles.surveyDate}>{date}</Text>
      </View>
      <View style={styles.surveyArrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

// Section Header Card
export interface SectionHeaderProps {
  title: string;
  badge?: React.ReactNode;
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, badge, style }) => {
  return (
    <View style={[styles.sectionHeader, style]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {badge && <View style={styles.sectionBadge}>{badge}</View>}
    </View>
  );
};

// Empty State Card
export interface EmptyStateProps {
  message: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message, icon, style }) => {
  return (
    <View style={[styles.emptyState, style]}>
      {icon && <View style={styles.emptyIcon}>{icon}</View>}
      <Text style={styles.emptyMessage}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.special.white,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
  },

  // Survey Card
  surveyCard: {
    backgroundColor: colors.special.white,
    padding: spacing.base,
    borderRadius: borderRadius.xl,
    ...shadows.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[50],
    gap: spacing.lg,
  },
  surveyIcon: {
    backgroundColor: colors.primary[100],
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[300],
  },
  surveyInfo: {
    flex: 1,
  },
  surveyId: {
    ...textStyles.label,
    color: colors.primary[600],
    marginBottom: spacing.xs / 2,
  },
  surveyDate: {
    ...textStyles.caption,
    color: colors.primary[500],
    fontWeight: '500',
  },
  surveyArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: colors.accent[400],
    fontWeight: 'bold',
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  sectionTitle: {
    ...textStyles.label,
    color: colors.primary[600],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionBadge: {
    // Badge component will handle its own styling
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: spacing.base,
  },
  emptyMessage: {
    ...textStyles.bodySmall,
    color: colors.primary[500],
    textAlign: 'center',
  },
});
