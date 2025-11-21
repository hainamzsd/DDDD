/**
 * App Navigator - Main navigation structure
 * Handles authentication flow and main app navigation
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/authStore';
import {
  LoginScreen,
  DashboardScreen,
  StartSurveyScreen,
  GPSCaptureScreen,
} from '../screens';
import { theme } from '../theme';
import { Body } from '../components';

// Import survey screens (to be created)
// import { PhotoCaptureScreen } from '../screens/PhotoCaptureScreen';
// import { ObjectInfoScreen } from '../screens/ObjectInfoScreen';
// import { PolygonDrawScreen } from '../screens/PolygonDrawScreen';
// import { ReviewSubmitScreen } from '../screens/ReviewSubmitScreen';
// import { HistoryScreen } from '../screens/HistoryScreen';
// import { SettingsScreen } from '../screens/SettingsScreen';

// Define navigation types
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  StartSurvey: undefined;
  GPSCapture: { surveyId: string };
  PhotoCapture: { surveyId: string };
  ObjectInfo: { surveyId: string };
  PolygonDraw: { surveyId: string };
  ReviewSubmit: { surveyId: string };
  History: undefined;
  Settings: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

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
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.neutral[100] },
        }}
      >
        {!isAuthenticated ? (
          // Auth Stack
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Main App Stack
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            {/* Survey Flow */}
            <Stack.Screen name="StartSurvey" component={StartSurveyScreen} />
            <Stack.Screen name="GPSCapture" component={GPSCaptureScreen} />
            {/* <Stack.Screen name="PhotoCapture" component={PhotoCaptureScreen} /> */}
            {/* <Stack.Screen name="ObjectInfo" component={ObjectInfoScreen} /> */}
            {/* <Stack.Screen name="PolygonDraw" component={PolygonDrawScreen} /> */}
            {/* <Stack.Screen name="ReviewSubmit" component={ReviewSubmitScreen} /> */}
            {/* <Stack.Screen name="History" component={HistoryScreen} /> */}
            {/* <Stack.Screen name="Settings" component={SettingsScreen} /> */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
  },
  loadingText: {
    marginTop: theme.spacing.base,
  },
});
