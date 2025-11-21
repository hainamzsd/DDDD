/**
 * GPS Capture Screen
 * Capture GPS coordinates for the surveyed location
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { useSurveyStore } from '../store/surveyStore';
import { gpsToGeographyPoint } from '../types/survey';
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

type GPSCaptureNavigationProp = StackNavigationProp<
  RootStackParamList,
  'GPSCapture'
>;

type GPSCaptureRouteProp = RouteProp<RootStackParamList, 'GPSCapture'>;

export const GPSCaptureScreen: React.FC = () => {
  const navigation = useNavigation<GPSCaptureNavigationProp>();
  const route = useRoute<GPSCaptureRouteProp>();
  const { updateSurvey, setStep } = useSurveyStore();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Request location permission on mount
  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        setError('Cần cấp quyền truy cập vị trí để sử dụng tính năng này');
      }
    } catch (error) {
      console.error('[GPSCapture] Permission error:', error);
      setError('Không thể yêu cầu quyền truy cập vị trí');
    }
  };

  const captureLocation = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Cần quyền truy cập',
        'Vui lòng cấp quyền truy cập vị trí trong cài đặt',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCapturing(true);
    setError(null);

    try {
      // Get current location with high accuracy
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation(currentLocation);
      console.log('[GPSCapture] Location captured:', currentLocation.coords);
    } catch (error: any) {
      console.error('[GPSCapture] Error capturing location:', error);
      setError('Không thể lấy vị trí. Vui lòng thử lại.');
      Alert.alert('Lỗi', 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetry = () => {
    setLocation(null);
    setError(null);
  };

  const handleNext = async () => {
    if (!location) {
      Alert.alert('Thông báo', 'Vui lòng thu thập tọa độ GPS trước', [
        { text: 'OK' },
      ]);
      return;
    }

    try {
      // Convert location to GeoJSON format
      const gpsPoint = gpsToGeographyPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        timestamp: location.timestamp,
      });

      // Update survey with GPS data
      await updateSurvey({
        gpsPoint,
        gpsAccuracyM: location.coords.accuracy,
        gpsSource: 'mobile_app',
      });

      // Move to next step
      setStep('photos');

      // Navigate to photo capture screen
      navigation.navigate('PhotoCapture', {
        surveyId: route.params.surveyId,
      });
    } catch (error: any) {
      console.error('[GPSCapture] Error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể lưu tọa độ GPS', [
        { text: 'OK' },
      ]);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Quay lại',
      'Tọa độ GPS chưa được lưu. Bạn có chắc chắn muốn quay lại?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Quay lại',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: true }
    );
  };

  const getAccuracyColor = (accuracy: number | null | undefined) => {
    if (!accuracy) return theme.colors.neutral[500];
    if (accuracy <= 10) return theme.colors.success[500];
    if (accuracy <= 30) return theme.colors.warning[500];
    return theme.colors.error[500];
  };

  const getAccuracyLabel = (accuracy: number | null | undefined) => {
    if (!accuracy) return 'Không xác định';
    if (accuracy <= 10) return 'Rất tốt';
    if (accuracy <= 30) return 'Tốt';
    if (accuracy <= 50) return 'Trung bình';
    return 'Kém';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.special.white} />
        </TouchableOpacity>
        <H3 color="white" style={styles.headerTitle}>
          Thu thập tọa độ GPS
        </H3>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Progress Indicator */}
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotComplete]}>
                <Feather name="check" size={8} color={theme.colors.special.white} />
              </View>
              <Label color="primary" style={styles.progressLabel}>
                Thông tin
              </Label>
            </View>
            <View style={[styles.progressLine, styles.progressLineComplete]} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Label color="primary" style={styles.progressLabel}>
                GPS
              </Label>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotInactive]} />
              <Label color="primary" style={styles.progressLabel}>
                Hình ảnh
              </Label>
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {!location ? (
            // Initial state - no location captured
            <View style={styles.capturePrompt}>
              <Badge variant="primary" size={80}>
                <Feather name="navigation" size={40} color={theme.colors.special.white} />
              </Badge>
              <H3 color="primary" align="center" style={styles.promptTitle}>
                Thu thập vị trí GPS
              </H3>
              <Body color="primary" align="center" style={styles.promptDescription}>
                Nhấn nút bên dưới để thu thập tọa độ GPS chính xác của địa điểm
              </Body>

              {error && (
                <Card style={styles.errorCard}>
                  <View style={styles.errorRow}>
                    <Feather name="alert-circle" size={16} color={theme.colors.error[600]} />
                    <Body color="primary" style={styles.errorText}>
                      {error}
                    </Body>
                  </View>
                </Card>
              )}

              <Button
                variant="secondary"
                onPress={captureLocation}
                disabled={!hasPermission || isCapturing}
                icon={
                  isCapturing ? (
                    <ActivityIndicator size="small" color={theme.colors.special.white} />
                  ) : (
                    <Feather name="crosshair" size={20} color={theme.colors.special.white} />
                  )
                }
                style={styles.captureButton}
              >
                {isCapturing ? 'Đang thu thập...' : 'Thu thập vị trí'}
              </Button>
            </View>
          ) : (
            // Location captured - show details
            <View style={styles.locationDetails}>
              <View style={styles.successBadgeContainer}>
                <Badge variant="success" size={64}>
                  <Feather name="check" size={32} color={theme.colors.special.white} />
                </Badge>
              </View>

              <H3 color="primary" align="center" style={styles.successTitle}>
                Vị trí đã được thu thập
              </H3>

              {/* Coordinates Card */}
              <Card style={styles.coordCard}>
                <View style={styles.coordRow}>
                  <Feather name="map-pin" size={20} color={theme.colors.primary[600]} />
                  <View style={styles.coordContent}>
                    <Label color="primary" style={styles.coordLabel}>
                      Vĩ độ (Latitude)
                    </Label>
                    <Body color="primary" style={styles.coordValue}>
                      {location.coords.latitude.toFixed(6)}°
                    </Body>
                  </View>
                </View>

                <View style={styles.coordDivider} />

                <View style={styles.coordRow}>
                  <Feather name="map-pin" size={20} color={theme.colors.primary[600]} />
                  <View style={styles.coordContent}>
                    <Label color="primary" style={styles.coordLabel}>
                      Kinh độ (Longitude)
                    </Label>
                    <Body color="primary" style={styles.coordValue}>
                      {location.coords.longitude.toFixed(6)}°
                    </Body>
                  </View>
                </View>

                <View style={styles.coordDivider} />

                <View style={styles.coordRow}>
                  <Feather name="target" size={20} color={getAccuracyColor(location.coords.accuracy)} />
                  <View style={styles.coordContent}>
                    <Label color="primary" style={styles.coordLabel}>
                      Độ chính xác
                    </Label>
                    <Body
                      color="primary"
                      style={[
                        styles.coordValue,
                        { color: getAccuracyColor(location.coords.accuracy) } as any,
                      ]}
                    >
                      ±{location.coords.accuracy?.toFixed(1)}m ({getAccuracyLabel(location.coords.accuracy)})
                    </Body>
                  </View>
                </View>
              </Card>

              {/* Info Card */}
              <Card style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Feather name="info" size={16} color={theme.colors.info[600]} />
                  <Body color="primary" style={styles.infoText}>
                    Tọa độ GPS càng chính xác thì vị trí địa điểm càng đúng. Nên thu thập ở nơi có tín hiệu GPS tốt.
                  </Body>
                </View>
              </Card>

              <Button
                variant="outline"
                onPress={handleRetry}
                icon={<Feather name="refresh-cw" size={20} color={theme.colors.primary[600]} />}
                style={styles.retryButton}
              >
                Thu thập lại
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      {location && (
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleBack}
            style={styles.footerButton}
          >
            Quay lại
          </Button>
          <Button
            variant="secondary"
            onPress={handleNext}
            style={styles.footerButton}
            icon={<Feather name="arrow-right" size={20} color={theme.colors.special.white} />}
          >
            Tiếp tục
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary[600],
    paddingTop: 50,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.base,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  progressSection: {
    marginBottom: theme.spacing.xl,
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressStep: {
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.secondary[500],
    marginBottom: theme.spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotComplete: {
    backgroundColor: theme.colors.success[500],
  },
  progressDotInactive: {
    backgroundColor: theme.colors.neutral[300],
  },
  progressLabel: {
    fontSize: theme.typography.fontSize.xs,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.neutral[300],
    marginHorizontal: theme.spacing.xs,
    marginBottom: 20,
  },
  progressLineComplete: {
    backgroundColor: theme.colors.success[500],
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  capturePrompt: {
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  promptTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  promptDescription: {
    opacity: 0.7,
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  errorCard: {
    padding: theme.spacing.base,
    backgroundColor: theme.colors.error[50],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.error[600],
    marginBottom: theme.spacing.base,
    width: '100%',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  errorText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  captureButton: {
    minWidth: 200,
  },
  locationDetails: {
    alignItems: 'center',
  },
  successBadgeContainer: {
    marginBottom: theme.spacing.lg,
  },
  successTitle: {
    marginBottom: theme.spacing.xl,
  },
  coordCard: {
    width: '100%',
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.base,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordContent: {
    flex: 1,
    marginLeft: theme.spacing.base,
  },
  coordLabel: {
    fontSize: theme.typography.fontSize.sm,
    opacity: 0.7,
    marginBottom: 2,
  },
  coordValue: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  coordDivider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginVertical: theme.spacing.base,
  },
  infoCard: {
    width: '100%',
    padding: theme.spacing.base,
    backgroundColor: theme.colors.info[50],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info[600],
    marginBottom: theme.spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  retryButton: {
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.special.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    gap: theme.spacing.base,
  },
  footerButton: {
    flex: 1,
  },
});
