import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  SafeScreen,
  CircularBadge,
  Input,
  PasswordInput,
  Button,
  CaptionBold,
  Heading1,
  Body,
} from '../components';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [idNumberError, setIdNumberError] = useState('');

  const { signIn, isLoading, error, clearError } = useAuthStore();

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      clearError();
    }
    if (idNumberError) {
      setIdNumberError('');
    }
  }, [idNumber, password]);

  // Show error alert
  useEffect(() => {
    if (error) {
      Alert.alert('Lỗi đăng nhập', error, [{ text: 'OK' }]);
    }
  }, [error]);

  const validateIdNumber = (value: string): boolean => {
    // Remove any non-digit characters
    const cleaned = value.replace(/\D/g, '');

    if (cleaned.length === 0) {
      setIdNumberError('Vui lòng nhập mã cán bộ');
      return false;
    }

    if (cleaned.length !== 12) {
      setIdNumberError('Mã cán bộ phải có đúng 12 chữ số');
      return false;
    }

    setIdNumberError('');
    return true;
  };

  const handleIdNumberChange = (value: string) => {
    // Only allow digits, max 12 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 12);
    setIdNumber(cleaned);
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!validateIdNumber(idNumber)) {
      return;
    }

    if (!password) {
      Alert.alert('Lỗi', 'Vui lòng nhập mật khẩu');
      return;
    }

    try {
      await signIn(idNumber, password);
      // On success, callback will be triggered
      onLoginSuccess?.();
    } catch (err) {
      // Error is handled by the store and shown in Alert via useEffect
      console.error('Login error:', err);
    }
  };

  const isFormValid = idNumber.length === 12 && password.length > 0;

  return (
    <SafeScreen backgroundColor={theme.colors.primary[600]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        {/* Header with badge */}
        <View style={styles.header}>
          <CircularBadge size={80} style={styles.badge}>
            <Feather name="shield" size={48} color={theme.colors.secondary[500]} />
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
          <Heading1 color="primary" align="center" style={styles.formTitle}>
            Đăng nhập hệ thống
          </Heading1>

          <Input
            label="Mã Cán Bộ"
            placeholder="Nhập 12 chữ số"
            value={idNumber}
            onChangeText={handleIdNumberChange}
            error={idNumberError}
            leftIcon={
              <Feather name="user" size={20} color={theme.colors.primary[500]} />
            }
            keyboardType="number-pad"
            autoCapitalize="none"
            maxLength={12}
            editable={!isLoading}
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
              <Feather name="eye-off" size={20} color={theme.colors.primary[500]} />
            }
            editable={!isLoading}
            onSubmitEditing={handleLogin}
            returnKeyType="done"
          />

          <Button
            fullWidth
            variant="primary"
            icon={<Feather name="log-in" size={20} color="white" />}
            onPress={handleLogin}
            loading={isLoading}
            disabled={!isFormValid || isLoading}
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
          <Feather name="lock" size={14} color="rgba(255, 255, 255, 0.5)" />
          <Body color="white" style={styles.securityText}>
            Kết nối bảo mật
          </Body>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary[600],
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing['2xl'],
    paddingBottom: theme.spacing['2xl'],
  },

  // Header styles
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  badge: {
    marginBottom: theme.spacing.base,
  },
  ministryText: {
    marginBottom: theme.spacing.xs,
    letterSpacing: 2,
    fontSize: theme.typography.fontSize.xs,
  },
  systemTitle: {
    marginBottom: theme.spacing.sm,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
  },
  welcomeMessage: {
    marginBottom: theme.spacing.base,
    opacity: 0.9,
    paddingHorizontal: theme.spacing.base,
    lineHeight: theme.typography.fontSize.sm * 1.6,
    fontSize: theme.typography.fontSize.sm,
  },

  // Login form styles
  loginForm: {
    width: '100%',
    backgroundColor: theme.colors.special.white,
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing['2xl'],
    ...theme.shadows.xl,
    marginBottom: theme.spacing.xl,
  },
  formTitle: {
    marginBottom: theme.spacing['2xl'],
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '700',
  },

  // Help section
  helpSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  helpText: {
    marginBottom: theme.spacing.sm,
    opacity: 0.8,
    fontSize: theme.typography.fontSize.sm,
  },
  helpLink: {
    fontWeight: '700',
    fontSize: theme.typography.fontSize.sm,
  },

  // Security badge
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.base,
    paddingBottom: theme.spacing.base,
  },
  securityText: {
    fontSize: theme.typography.fontSize.xs,
    opacity: 0.6,
  },
});
