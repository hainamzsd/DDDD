/**
 * SafeScreen Component
 * A wrapper component that ensures content respects safe areas (notch, home indicator)
 * and provides consistent screen layout across the app.
 */

import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
  backgroundColor?: string;
}

/**
 * SafeScreen - Ensures content doesn't appear behind notch or home indicator
 *
 * @param children - Screen content
 * @param style - Additional styles
 * @param edges - Which edges to apply safe area (default: all)
 * @param backgroundColor - Background color (default: neutral[100])
 */
export const SafeScreen: React.FC<SafeScreenProps> = ({
  children,
  style,
  edges = ['top', 'right', 'bottom', 'left'],
  backgroundColor = theme.colors.neutral[100],
}) => {
  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor }, style]}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
