/**
 * Example Screens - Recreating the LocationID Tracker design
 *
 * These examples show how to use the component library to recreate
 * the screens from the original HTML export.
 */

import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  Header,
  SettingsButton,
  Button,
  Badge,
  SectionHeader,
  SurveyCard,
  EmptyState,
  Input,
  PasswordInput,
  CircularBadge,
  CaptionBold,
  Heading1,
  Body,
} from '../components';
import { theme } from '../theme';

// ============================================================================
// Example 1: Start Survey Screen (Home Screen)
// ============================================================================

export const StartSurveyScreen = () => {
  const [surveys] = useState([
    { id: '2024-0847', date: 'Today, 10:32 AM' },
    { id: '2024-0846', date: 'Today, 09:15 AM' },
    { id: '2024-0845', date: 'Yesterday, 4:22 PM' },
  ]);

  return (
    <ScrollView style={styles.container}>
      {/* Header with badge and settings */}
      <Header
        title="Officer J. Martinez"
        subtitle="Xin chào,"
        badgeIcon={
          <Feather
            name="shield"
            size={32}
            color={theme.colors.secondary[500]}
          />
        }
        rightAction={
          <SettingsButton
            onPress={() => console.log('Settings pressed')}
            icon={<Feather name="settings" size={20} color="white" />}
          />
        }
      />

      {/* App title */}
      <CaptionBold color="primary" style={styles.appTitle}>
        NLIS FIELD SURVEY
      </CaptionBold>

      {/* Main heading */}
      <Heading1 color="primary" style={styles.mainHeading}>
        Ready to Start a New Survey?
      </Heading1>

      {/* Start button */}
      <Button
        fullWidth
        variant="primary"
        icon={<Feather name="plus-circle" size={20} color="white" />}
        onPress={() => console.log('Start new survey')}
        style={styles.startButton}
      >
        Start New Survey
      </Button>

      {/* Unsynced surveys section */}
      <View style={styles.section}>
        <SectionHeader
          title="Unsynced Surveys"
          badge={
            <Badge
              variant="warning"
              icon={
                <Feather
                  name="wifi-off"
                  size={12}
                  color={theme.colors.accent[900]}
                />
              }
            >
              {surveys.length}
            </Badge>
          }
        />

        <View style={styles.surveyList}>
          {surveys.map((survey) => (
            <SurveyCard
              key={survey.id}
              surveyId={`Survey #${survey.id}`}
              date={survey.date}
              icon={
                <Feather
                  name="map-pin"
                  size={20}
                  color={theme.colors.primary[500]}
                />
              }
              onPress={() => console.log('Survey pressed:', survey.id)}
              style={styles.surveyItem}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

// ============================================================================
// Example 2: Login Screen
// ============================================================================

export const LoginScreen = () => {
  const [officerId, setOfficerId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    // Simulate login
    setTimeout(() => {
      setLoading(false);
      console.log('Login successful');
    }, 2000);
  };

  return (
    <ScrollView
      style={styles.loginContainer}
      contentContainerStyle={styles.loginContent}
    >
      {/* Badge and title */}
      <View style={styles.loginHeader}>
        <CircularBadge size={96}>
          <Feather
            name="shield"
            size={56}
            color={theme.colors.secondary[500]}
          />
        </CircularBadge>

        <CaptionBold color="accent" style={styles.ministryText}>
          BỘ CÔNG AN
        </CaptionBold>

        <Heading1 color="white" style={styles.systemTitle}>
          NLIS Field Survey
        </Heading1>

        <Body color="white" align="center" style={styles.welcomeMessage}>
          Hệ thống định danh vị trí quốc gia{'\n'}
          Chào mừng cán bộ thực địa
        </Body>
      </View>

      {/* Login form */}
      <View style={styles.loginForm}>
        <Heading1
          color="primary"
          align="center"
          style={styles.formTitle}
        >
          Đăng nhập hệ thống
        </Heading1>

        <Input
          label="Mã Cán Bộ"
          placeholder="Nhập mã cán bộ"
          value={officerId}
          onChangeText={setOfficerId}
          leftIcon={
            <Feather name="user" size={20} color={theme.colors.primary[500]} />
          }
          autoCapitalize="none"
        />

        <PasswordInput
          label="Mật Khẩu"
          placeholder="Nhập mật khẩu"
          value={password}
          onChangeText={setPassword}
          leftIcon={
            <Feather name="lock" size={20} color={theme.colors.primary[500]} />
          }
          visibilityIcon={
            <Feather name="eye" size={20} color={theme.colors.primary[500]} />
          }
          visibilityOffIcon={
            <Feather
              name="eye-off"
              size={20}
              color={theme.colors.primary[500]}
            />
          }
        />

        <Button
          fullWidth
          variant="primary"
          icon={<Feather name="log-in" size={20} color="white" />}
          onPress={handleLogin}
          loading={loading}
          disabled={!officerId || !password || loading}
        >
          Đăng Nhập
        </Button>
      </View>

      {/* Help section */}
      <View style={styles.helpSection}>
        <Body color="white" align="center" style={styles.helpText}>
          Cần hỗ trợ đăng nhập?
        </Body>
        <Body color="accent" align="center" style={styles.helpLink}>
          Liên hệ bộ phận hỗ trợ →
        </Body>
      </View>

      {/* Security badge */}
      <View style={styles.securityBadge}>
        <Feather name="lock" size={16} color="rgba(255, 255, 255, 0.5)" />
        <Body color="white" style={styles.securityText}>
          Kết nối bảo mật
        </Body>
      </View>
    </ScrollView>
  );
};

// ============================================================================
// Example 3: Empty State Screen
// ============================================================================

export const EmptyStateScreen = () => {
  return (
    <View style={styles.container}>
      <Header
        title="Officer J. Martinez"
        subtitle="Xin chào,"
        badgeIcon={
          <Feather
            name="shield"
            size={32}
            color={theme.colors.secondary[500]}
          />
        }
      />

      <CaptionBold color="primary" style={styles.appTitle}>
        NLIS FIELD SURVEY
      </CaptionBold>

      <Heading1 color="primary" style={styles.mainHeading}>
        Ready to Start a New Survey?
      </Heading1>

      <Button
        fullWidth
        variant="primary"
        icon={<Feather name="plus-circle" size={20} color="white" />}
        onPress={() => console.log('Start new survey')}
        style={styles.startButton}
      >
        Start New Survey
      </Button>

      <View style={styles.section}>
        <SectionHeader
          title="Unsynced Surveys"
          badge={
            <Badge
              variant="warning"
              icon={
                <Feather
                  name="wifi-off"
                  size={12}
                  color={theme.colors.accent[900]}
                />
              }
            >
              0
            </Badge>
          }
        />

        <EmptyState
          message="Không có khảo sát nào chưa đồng bộ"
          icon={
            <Feather
              name="inbox"
              size={48}
              color={theme.colors.primary[500]}
            />
          }
        />
      </View>
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
    padding: theme.spacing.lg,
  },
  appTitle: {
    marginBottom: theme.spacing.sm,
  },
  mainHeading: {
    marginBottom: theme.spacing['2xl'],
    lineHeight: theme.textStyles.h1.lineHeight * theme.textStyles.h1.fontSize,
  },
  startButton: {
    marginBottom: theme.spacing['2xl'],
  },
  section: {
    flex: 1,
  },
  surveyList: {
    gap: theme.spacing.md,
  },
  surveyItem: {
    marginBottom: theme.spacing.xs,
  },

  // Login screen styles
  loginContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary[600],
  },
  loginContent: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  loginHeader: {
    alignItems: 'center',
    marginTop: theme.spacing['2xl'],
    marginBottom: theme.spacing['2xl'],
  },
  ministryText: {
    marginTop: theme.spacing.base,
    marginBottom: theme.spacing.xs,
  },
  systemTitle: {
    marginBottom: theme.spacing.sm,
  },
  welcomeMessage: {
    marginBottom: theme.spacing['2xl'],
    opacity: 0.8,
    paddingHorizontal: theme.spacing.base,
  },
  loginForm: {
    width: '100%',
    backgroundColor: theme.colors.special.white,
    borderRadius: theme.borderRadius['3xl'],
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  formTitle: {
    marginBottom: theme.spacing.xl,
    fontSize: theme.textStyles.h4.fontSize,
  },
  helpSection: {
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  helpText: {
    marginBottom: theme.spacing.sm,
    opacity: 0.7,
  },
  helpLink: {
    fontWeight: '600',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: 'auto',
    paddingTop: theme.spacing['2xl'],
  },
  securityText: {
    fontSize: theme.typography.fontSize.xs,
    opacity: 0.5,
  },
});
