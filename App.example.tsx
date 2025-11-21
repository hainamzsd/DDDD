/**
 * Example App.tsx - Authentication Integration
 *
 * This example shows how to integrate the LoginScreen with your app.
 * Replace your App.tsx with this code to test authentication.
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LoginScreen } from './screens';
import { useAuthStore } from './store/authStore';
import { theme } from './theme';
import { Body } from './components';

export default function App() {
  const { isAuthenticated, isLoading, checkAuth, user } = useAuthStore();

  // Check for existing session on app start
  useEffect(() => {
    checkAuth();
  }, []);

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary[600]} />
        <Body color="primary" style={styles.loadingText}>
          Đang tải...
        </Body>
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isAuthenticated ? 'dark' : 'light'} />

      {!isAuthenticated ? (
        // Show login screen if not authenticated
        <LoginScreen
          onLoginSuccess={() => {
            console.log('Login successful! User:', user?.fullName);
            // Navigation will happen automatically when isAuthenticated changes
          }}
        />
      ) : (
        // Show main app content when authenticated
        <DashboardPlaceholder />
      )}
    </>
  );
}

// Placeholder for Dashboard screen
// Replace this with your actual Dashboard component
const DashboardPlaceholder: React.FC = () => {
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={styles.dashboardContainer}>
      <View style={styles.dashboardContent}>
        <Body color="primary" align="center" style={styles.welcomeText}>
          Xin chào, {user?.fullName}!
        </Body>
        <Body color="primary" align="center" style={styles.roleText}>
          Vai trò: {user?.role}
        </Body>
        <Body color="primary" align="center" style={styles.unitText}>
          Đơn vị: {user?.unitCode}
        </Body>

        {/* Add your dashboard content here */}
        <View style={styles.placeholder}>
          <Body color="primary" align="center">
            Dashboard sẽ được triển khai ở đây
          </Body>
        </View>

        {/* Sign out button */}
        <View style={styles.signOutButton}>
          <Body
            color="secondary"
            align="center"
            style={styles.signOutText}
            onPress={handleSignOut}
          >
            Đăng xuất →
          </Body>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Loading screen
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
  },
  loadingText: {
    marginTop: theme.spacing.base,
  },

  // Dashboard
  dashboardContainer: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
  },
  dashboardContent: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  welcomeText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  roleText: {
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing.xs,
    textTransform: 'capitalize',
  },
  unitText: {
    fontSize: theme.typography.fontSize.base,
    marginBottom: theme.spacing['2xl'],
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.special.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing['2xl'],
    marginVertical: theme.spacing.xl,
  },
  signOutButton: {
    marginTop: theme.spacing.xl,
  },
  signOutText: {
    fontWeight: '600',
    fontSize: theme.typography.fontSize.lg,
  },
});
