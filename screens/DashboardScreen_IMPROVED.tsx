/**
 * Dashboard Screen - Main hub after login
 * Shows officer info, navigation options, and offline status
 * IMPROVED VERSION with better spacing and readability
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import NetInfo from '@react-native-community/netinfo';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { theme } from '../theme';
import {
  H3,
  Body,
  Label,
  Button,
  Card,
  Badge,
} from '../components';
import type { RootStackParamList } from '../navigation/AppNavigator';

type DashboardNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const { user, signOut } = useAuthStore();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // TODO: Get pending sync count from sync store
  useEffect(() => {
    // This will be implemented when we create the sync store
    setPendingSyncCount(0);
  }, []);

  const handleSignOut = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleStartSurvey = () => {
    navigation.navigate('StartSurvey');
  };

  const handleViewHistory = () => {
    // TODO: Navigate to History screen
    Alert.alert(
      'Lịch sử khảo sát',
      'Tính năng này đang được phát triển',
      [{ text: 'OK' }]
    );
  };

  const handleSettings = () => {
    // TODO: Navigate to Settings screen
    Alert.alert(
      'Cài đặt',
      'Tính năng này đang được phát triển',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary[600]}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.welcomeSection}>
            <Badge variant="primary" size={48}>
              <Feather name="shield" size={24} color={theme.colors.special.white} />
            </Badge>
            <View style={styles.welcomeText}>
              <Label color="white" style={styles.greeting}>
                Xin chào,
              </Label>
              <H3 color="white" style={styles.userName} numberOfLines={1} ellipsizeMode="tail">
                {user?.fullName || 'Cán bộ'}
              </H3>
              <Label color="white" style={styles.userInfo}>
                Mã CB: {user?.idNumber || 'N/A'}
              </Label>
            </View>
          </View>
          <TouchableOpacity onPress={handleSettings} hitSlop={8}>
            <Feather name="settings" size={24} color={theme.colors.special.white} />
          </TouchableOpacity>
        </View>

        {/* Online/Offline Status */}
        <View style={styles.statusBar}>
          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? theme.colors.success[500] : theme.colors.error[500] },
              ]}
            />
            <Label color="white">
              {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
            </Label>
          </View>
          {pendingSyncCount > 0 && (
            <View style={styles.syncBadge}>
              <Feather name="upload-cloud" size={14} color={theme.colors.accent[500]} />
              <Label color="white" style={styles.syncText}>
                {pendingSyncCount} chờ đồng bộ
              </Label>
            </View>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Offline notice */}
        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Feather name="alert-triangle" size={18} color={theme.colors.warning[700]} />
            <Body color="primary" style={styles.offlineText}>
              Bạn đang ngoại tuyến. Vẫn có thể tạo khảo sát mới, dữ liệu sẽ được đồng bộ khi có kết nối.
            </Body>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <H3 color="primary" style={styles.sectionTitle}>
            Hành động nhanh
          </H3>

          {/* Start New Survey Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStartSurvey}
          >
            <Card style={styles.primaryCard}>
              <View style={styles.cardContent}>
                <Badge variant="secondary" size={56}>
                  <Feather name="map-pin" size={28} color={theme.colors.special.white} />
                </Badge>
                <View style={styles.cardText}>
                  <H3 color="primary">Bắt đầu khảo sát mới</H3>
                  <Body color="primary" style={styles.cardDescription}>
                    Tạo một bản ghi khảo sát địa điểm mới
                  </Body>
                </View>
              </View>
              <Button
                variant="secondary"
                onPress={handleStartSurvey}
                icon={<Feather name="plus" size={20} color={theme.colors.special.white} />}
              >
                Bắt đầu
              </Button>
            </Card>
          </TouchableOpacity>
        </View>

        {/* Navigation Cards */}
        <View style={styles.section}>
          <H3 color="primary" style={styles.sectionTitle}>
            Quản lý
          </H3>

          <View style={styles.navigationGrid}>
            {/* History Card */}
            <TouchableOpacity
              style={styles.navCard}
              onPress={handleViewHistory}
              activeOpacity={0.8}
            >
              <Badge variant="primary" size={48}>
                <Feather name="list" size={24} color={theme.colors.special.white} />
              </Badge>
              <Body color="primary" style={styles.navCardTitle}>
                Lịch sử
              </Body>
              <Label color="primary" style={styles.navCardDescription}>
                Xem các khảo sát đã thực hiện
              </Label>
            </TouchableOpacity>

            {/* Settings Card */}
            <TouchableOpacity
              style={styles.navCard}
              onPress={handleSettings}
              activeOpacity={0.8}
            >
              <Badge variant="info" size={48}>
                <Feather name="settings" size={24} color={theme.colors.special.white} />
              </Badge>
              <Body color="primary" style={styles.navCardTitle}>
                Cài đặt
              </Body>
              <Label color="primary" style={styles.navCardDescription}>
                Cấu hình ứng dụng
              </Label>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.section}>
          <Card style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Feather name="info" size={18} color={theme.colors.info[600]} />
              <Body color="primary" style={styles.infoText}>
                Ứng dụng hỗ trợ làm việc ngoại tuyến. Dữ liệu sẽ được đồng bộ tự động khi có kết nối.
              </Body>
            </View>
          </Card>
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <TouchableOpacity
            onPress={handleSignOut}
            activeOpacity={0.8}
            style={styles.signOutButton}
          >
            <Body color="secondary" align="center" style={styles.signOutText}>
              Đăng xuất
            </Body>
            <Feather
              name="log-out"
              size={18}
              color={theme.colors.secondary[600]}
              style={styles.signOutIcon}
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
  },
  header: {
    backgroundColor: theme.colors.primary[600],
    paddingTop: 40,                         // IMPROVED: increased from 32
    paddingHorizontal: theme.spacing.xl,    // IMPROVED: increased from lg
    paddingBottom: theme.spacing.xl,        // IMPROVED: increased from lg
    borderBottomLeftRadius: theme.borderRadius['2xl'],
    borderBottomRightRadius: theme.borderRadius['2xl'],
    ...theme.shadows.primary,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,         // IMPROVED: increased from base
  },
  welcomeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.base,        // IMPROVED: added margin
  },
  welcomeText: {
    marginLeft: theme.spacing.lg,           // IMPROVED: increased from base
    flex: 1,
  },
  greeting: {
    fontSize: theme.typography.fontSize.base,  // IMPROVED: increased from sm
    opacity: 0.9,
    marginBottom: 4,                        // IMPROVED: added margin
  },
  userName: {
    fontWeight: 'bold',
    marginTop: 4,                           // IMPROVED: increased from 2
    marginBottom: 4,                        // IMPROVED: increased from 2
  },
  userInfo: {
    fontSize: theme.typography.fontSize.sm,    // IMPROVED: increased from xs
    opacity: 0.85,                          // IMPROVED: increased from 0.8
    marginTop: 4,                           // IMPROVED: increased from 2
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.lg,            // IMPROVED: increased from base
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.base,  // IMPROVED: increased from sm
    paddingVertical: theme.spacing.sm,      // IMPROVED: increased from xs
    borderRadius: theme.borderRadius.full,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,          // IMPROVED: increased from xs
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: theme.spacing.base,  // IMPROVED: increased from sm
    paddingVertical: theme.spacing.sm,      // IMPROVED: increased from xs
    borderRadius: theme.borderRadius.full,
  },
  syncText: {
    marginLeft: theme.spacing.sm,           // IMPROVED: increased from xs
    fontSize: theme.typography.fontSize.sm, // IMPROVED: increased from xs
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.xl,              // IMPROVED: increased from lg
    paddingBottom: theme.spacing['3xl'],    // IMPROVED: increased from 2xl
  },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.warning[50],
    borderRadius: theme.borderRadius.xl,    // IMPROVED: increased from lg
    padding: theme.spacing.lg,              // IMPROVED: increased from base
    marginBottom: theme.spacing.xl,         // IMPROVED: increased from lg
    borderWidth: 1,
    borderColor: theme.colors.warning[200],
  },
  offlineText: {
    flex: 1,
    marginLeft: theme.spacing.base,         // IMPROVED: increased from sm
    fontSize: theme.typography.fontSize.base,  // IMPROVED: increased from sm
    lineHeight: 24,                         // IMPROVED: added explicit line height
  },
  section: {
    marginBottom: theme.spacing['2xl'],     // IMPROVED: increased from xl
  },
  sectionTitle: {
    marginBottom: theme.spacing.lg,         // IMPROVED: increased from base
    fontWeight: '600',
    fontSize: theme.typography.fontSize.xl, // IMPROVED: added explicit size
  },
  primaryCard: {
    padding: theme.spacing.xl,              // IMPROVED: increased from lg
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,         // IMPROVED: increased from base
  },
  cardText: {
    flex: 1,
    marginLeft: theme.spacing.lg,           // IMPROVED: increased from base
  },
  cardDescription: {
    marginTop: theme.spacing.sm,            // IMPROVED: increased from xs
    fontSize: theme.typography.fontSize.base,  // IMPROVED: increased from sm
    opacity: 0.7,
    lineHeight: 22,                         // IMPROVED: added explicit line height
  },
  navigationGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.base,                // IMPROVED: added gap
  },
  navCard: {
    width: '48%',
    backgroundColor: theme.colors.special.white,
    padding: theme.spacing.lg,              // IMPROVED: increased from base
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    ...theme.shadows.sm,
    minHeight: 140,                         // IMPROVED: added min height
  },
  navCardTitle: {
    fontWeight: '600',
    marginTop: theme.spacing.base,          // IMPROVED: increased from sm
    marginBottom: theme.spacing.sm,         // IMPROVED: increased from xs
    fontSize: theme.typography.fontSize.base,  // IMPROVED: added explicit size
  },
  navCardDescription: {
    fontSize: theme.typography.fontSize.sm, // IMPROVED: increased from xs
    textAlign: 'center',
    opacity: 0.7,                           // IMPROVED: increased from 0.6
    lineHeight: 20,                         // IMPROVED: added explicit line height
    paddingHorizontal: theme.spacing.xs,    // IMPROVED: added padding
  },
  infoCard: {
    padding: theme.spacing.lg,              // IMPROVED: increased from base
    backgroundColor: theme.colors.info[50],
    borderLeftWidth: 4,                     // IMPROVED: increased from 3
    borderLeftColor: theme.colors.info[600],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.base,         // IMPROVED: increased from sm
    fontSize: theme.typography.fontSize.base,  // IMPROVED: increased from sm
    lineHeight: 24,                         // IMPROVED: increased from 20
  },
  signOutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.xl,    // IMPROVED: increased from lg
    paddingVertical: theme.spacing.base,    // IMPROVED: increased from sm
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.secondary[300],
    backgroundColor: theme.colors.special.white,
  },
  signOutText: {
    fontWeight: '600',
    fontSize: theme.typography.fontSize.lg,
  },
  signOutIcon: {
    marginLeft: theme.spacing.sm,           // IMPROVED: increased from xs
  },
});
