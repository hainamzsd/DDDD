/**
 * PolygonDrawScreen - Draw boundary polygon for surveyed location
 * Allows officers to draw a rough boundary polygon by tapping on a map
 * This is an optional step - users can skip if they don't want to draw a boundary
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SafeScreen } from '../components/SafeScreen';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { theme } from '../theme';
import { useSurveyStore } from '../store/surveyStore';
import { SurveyVertex } from '../types/survey';
import { validatePolygonVertices } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'PolygonDraw'>;

interface MapPoint {
  latitude: number;
  longitude: number;
}

export const PolygonDrawScreen: React.FC<Props> = ({ navigation, route }) => {
  const { currentSurvey, currentVertices, setVertices, setStep } = useSurveyStore();

  const [points, setPoints] = useState<MapPoint[]>([]);
  const [mapRegion, setMapRegion] = useState({
    latitude: 21.0285, // Default to Hanoi
    longitude: 105.8542,
    latitudeDelta: 0.001, // Zoom in close for drawing
    longitudeDelta: 0.001,
  });

  // Initialize map center from GPS coordinates
  useEffect(() => {
    if (currentSurvey?.gpsPoint) {
      const [lng, lat] = currentSurvey.gpsPoint.coordinates;
      setMapRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      });
    }
  }, [currentSurvey]);

  // Load existing vertices if any
  useEffect(() => {
    if (currentVertices && currentVertices.length > 0) {
      const existingPoints = currentVertices
        .sort((a, b) => a.seq - b.seq)
        .map(v => ({
          latitude: v.lat,
          longitude: v.lng,
        }));
      setPoints(existingPoints);
    }
  }, [currentVertices]);

  const handleMapPress = (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPoints([...points, { latitude, longitude }]);
  };

  const handleUndoLastPoint = () => {
    if (points.length === 0) return;
    setPoints(points.slice(0, -1));
  };

  const handleClearAll = () => {
    Alert.alert(
      'Xóa tất cả điểm?',
      'Bạn có chắc chắn muốn xóa tất cả các điểm đã đánh dấu?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => setPoints([]),
        },
      ]
    );
  };

  const handleSave = async () => {
    if (points.length < 3) {
      Alert.alert(
        'Chưa đủ điểm',
        'Cần ít nhất 3 điểm để tạo vùng đa giác. Vui lòng thêm điểm hoặc bỏ qua bước này.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Validate polygon vertices (coordinates and minimum count)
    const validation = validatePolygonVertices(points);
    if (!validation.isValid) {
      Alert.alert(
        'Đa giác không hợp lệ',
        validation.errorMessage || 'Tọa độ đa giác không hợp lệ. Vui lòng kiểm tra lại.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Convert points to vertices
      const vertices: SurveyVertex[] = points.map((point, index) => ({
        id: `vertex_${currentSurvey?.clientLocalId}_${index}`,
        surveyLocationId: currentSurvey?.id || currentSurvey?.clientLocalId || '',
        seq: index,
        lat: point.latitude,
        lng: point.longitude,
        createdAt: new Date().toISOString(),
      }));

      await setVertices(vertices);
      setStep('review');

      Alert.alert(
        'Đã lưu vùng đa giác',
        `Đã lưu vùng đa giác với ${points.length} điểm.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ReviewSubmit', { surveyId: route.params.surveyId }),
          },
        ]
      );
    } catch (error: any) {
      console.error('[PolygonDraw] Failed to save vertices:', error);
      Alert.alert('Lỗi', 'Không thể lưu vùng đa giác. Vui lòng thử lại.');
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Bỏ qua vẽ đa giác?',
      'Bạn có thể bỏ qua bước này nếu không cần vẽ ranh giới. Bạn có muốn tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bỏ qua',
          onPress: async () => {
            // Clear any existing vertices
            await setVertices([]);
            setStep('review');
            navigation.navigate('ReviewSubmit', { surveyId: route.params.surveyId });
          },
        },
      ]
    );
  };

  // Get GPS marker position
  const gpsMarker: MapPoint | null = currentSurvey?.gpsPoint
    ? {
        latitude: currentSurvey.gpsPoint.coordinates[1],
        longitude: currentSurvey.gpsPoint.coordinates[0],
      }
    : null;

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.primary[600]} />
          </TouchableOpacity>
          <Typography variant="h2" style={styles.headerTitle}>
            Vẽ Ranh Giới
          </Typography>
          <View style={styles.headerRight} />
        </View>

        {/* Instructions Card */}
        <Card style={styles.instructionsCard}>
          <View style={styles.instructionRow}>
            <Feather name="info" size={20} color={theme.colors.primary[600]} />
            <Typography variant="body" style={styles.instructionText}>
              Nhấn vào bản đồ để đánh dấu các điểm ranh giới. Cần ít nhất 3 điểm.
            </Typography>
          </View>
          <View style={styles.instructionRow}>
            <Feather name="map-pin" size={20} color={theme.colors.accent[500]} />
            <Typography variant="body" style={styles.instructionText}>
              Điểm vàng là vị trí GPS đã chụp. Xanh lá là điểm ranh giới.
            </Typography>
          </View>
        </Card>

        {/* Map View */}
        <Card style={styles.mapCard}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            onPress={handleMapPress}
            showsUserLocation
            showsMyLocationButton
          >
            {/* GPS marker */}
            {gpsMarker && (
              <Marker
                coordinate={gpsMarker}
                pinColor={theme.colors.accent[500]}
                title="Vị trí GPS"
              />
            )}

            {/* Boundary points */}
            {points.map((point, index) => (
              <Marker
                key={`point-${index}`}
                coordinate={point}
                pinColor={theme.colors.primary[600]}
              >
                <View style={styles.pointMarker}>
                  <Typography variant="caption" style={styles.pointNumber}>
                    {index + 1}
                  </Typography>
                </View>
              </Marker>
            ))}

            {/* Polygon */}
            {points.length >= 3 && (
              <Polygon
                coordinates={points}
                strokeColor={theme.colors.primary[600]}
                fillColor={`${theme.colors.primary[600]}33`} // 20% opacity
                strokeWidth={2}
              />
            )}
          </MapView>

          {/* Point counter */}
          <View style={styles.pointCounter}>
            <Feather name="target" size={20} color={theme.colors.neutral[700]} />
            <Typography variant="body" style={styles.pointCountText}>
              {points.length} điểm
            </Typography>
          </View>
        </Card>

        {/* Controls */}
        <View style={styles.controls}>
          <View style={styles.controlButtons}>
            <Button
              variant="outline"
              onPress={handleUndoLastPoint}
              disabled={points.length === 0}
              style={styles.controlButton}
            >
              <Feather name="corner-up-left" size={20} color={theme.colors.primary[600]} />
              <Typography variant="body" style={styles.controlButtonText}>
                Hoàn tác
              </Typography>
            </Button>

            <Button
              variant="outline"
              onPress={handleClearAll}
              disabled={points.length === 0}
              style={styles.controlButton}
            >
              <Feather name="trash-2" size={20} color={theme.colors.error[500]} />
              <Typography variant="body" style={styles.clearText}>
                Xóa tất cả
              </Typography>
            </Button>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button variant="outline" onPress={handleSkip} style={styles.skipButton}>
              Bỏ qua
            </Button>
            <Button
              variant="primary"
              onPress={handleSave}
              disabled={points.length < 3}
              style={styles.saveButton}
            >
              Lưu và tiếp tục
            </Button>
          </View>
        </View>
      </View>
    </SafeScreen>
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
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.special.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[300],
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    marginHorizontal: theme.spacing.base,
  },
  headerRight: {
    width: 40,
  },
  instructionsCard: {
    margin: theme.spacing.base,
    padding: theme.spacing.base,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  instructionText: {
    marginLeft: theme.spacing.sm,
    flex: 1,
    color: theme.colors.neutral[700],
  },
  mapCard: {
    flex: 1,
    margin: theme.spacing.base,
    marginTop: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  map: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
  },
  pointMarker: {
    backgroundColor: theme.colors.primary[600],
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.special.white,
  },
  pointNumber: {
    color: theme.colors.special.white,
    fontWeight: 'bold',
  },
  pointCounter: {
    position: 'absolute',
    top: theme.spacing.base,
    right: theme.spacing.base,
    backgroundColor: theme.colors.special.white,
    paddingHorizontal: theme.spacing.base,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...theme.shadows.md,
  },
  pointCountText: {
    marginLeft: theme.spacing.xs,
    fontWeight: '600',
  },
  controls: {
    padding: theme.spacing.base,
    backgroundColor: theme.colors.special.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[300],
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.base,
  },
  controlButton: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.primary[600],
  },
  clearText: {
    marginLeft: theme.spacing.xs,
    color: theme.colors.error[500],
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skipButton: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  saveButton: {
    flex: 2,
  },
});
