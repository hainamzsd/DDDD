/**
 * OfflineBanner Component
 * Displays a banner at the top of the screen when the device is offline
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSyncStore, initializeSyncStore } from '../store/syncStore';
import { theme } from '../theme';

export const OfflineBanner: React.FC = () => {
  const isOnline = useSyncStore((state) => state.isOnline);
  const slideAnim = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    // Initialize sync store on mount
    initializeSyncStore();
  }, []);

  useEffect(() => {
    if (!isOnline) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Slide up
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isOnline, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Chế độ ngoại tuyến</Text>
          <Text style={styles.subtitle}>
            Dữ liệu sẽ được đồng bộ khi có kết nối
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: theme.colors.accent[500],
    paddingTop: 40, // Account for status bar
    paddingBottom: 12,
    paddingHorizontal: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: theme.spacing.sm,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.neutral[900],
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.neutral[700],
  },
});
