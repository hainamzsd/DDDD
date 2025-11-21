/**
 * LocationID Tracker (C06) - Main App Entry Point
 * A React Native mobile app for Vietnamese commune police officers
 * to perform field surveys of physical locations.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './navigation/AppNavigator';
import { OfflineBanner } from './components';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
      <OfflineBanner />
    </SafeAreaProvider>
  );
}
