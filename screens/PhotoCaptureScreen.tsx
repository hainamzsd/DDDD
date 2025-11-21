/**
 * Photo Capture Screen
 * Capture and manage photos for the surveyed location
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useSurveyStore } from '../store/surveyStore';
import { SurveyMedia } from '../types/survey';
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

type PhotoCaptureNavigationProp = StackNavigationProp<
  RootStackParamList,
  'PhotoCapture'
>;

type PhotoCaptureRouteProp = RouteProp<RootStackParamList, 'PhotoCapture'>;

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - theme.spacing.lg * 2 - theme.spacing.base) / 2;

export const PhotoCaptureScreen: React.FC = () => {
  const navigation = useNavigation<PhotoCaptureNavigationProp>();
  const route = useRoute<PhotoCaptureRouteProp>();
  const { currentPhotos, addPhoto, removePhoto, setStep } = useSurveyStore();

  const [hasPermission, setHasPermission] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  // Request camera permission on mount
  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');

      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Cần cấp quyền truy cập camera để chụp ảnh',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('[PhotoCapture] Permission error:', error);
    }
  };

  const capturePhoto = async () => {
    if (!hasPermission) {
      Alert.alert(
        'Cần quyền truy cập',
        'Vui lòng cấp quyền truy cập camera trong cài đặt',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsCapturing(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const photo: SurveyMedia = {
          id: `photo_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          surveyLocationId: route.params.surveyId,
          mediaType: 'photo',
          filePath: asset.uri,
          thumbnailPath: null,
          capturedAt: new Date().toISOString(),
          note: null,
          gpsPoint: null, // GPS point would be added from current location if available
          createdAt: new Date().toISOString(),
          localUri: asset.uri,
        };

        await addPhoto(photo);
        console.log('[PhotoCapture] Photo added:', photo.id);

        // Trigger success haptic feedback
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {
          // Silently fail if haptics not supported
        });
      }
    } catch (error: any) {
      console.error('[PhotoCapture] Error capturing photo:', error);

      // Trigger error haptic feedback
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {
        // Silently fail if haptics not supported
      });

      Alert.alert('Lỗi', 'Không thể chụp ảnh. Vui lòng thử lại.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsCapturing(false);
    }
  };

  const selectFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Cần quyền truy cập',
          'Vui lòng cấp quyền truy cập thư viện ảnh',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5 - currentPhotos.length, // Limit to 5 total photos
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        for (const asset of result.assets) {
          const photo: SurveyMedia = {
            id: `photo_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            surveyLocationId: route.params.surveyId,
            mediaType: 'photo',
            filePath: asset.uri,
            thumbnailPath: null,
            capturedAt: new Date().toISOString(),
            note: null,
            gpsPoint: null,
            createdAt: new Date().toISOString(),
            localUri: asset.uri,
          };

          await addPhoto(photo);
        }

        console.log('[PhotoCapture] Photos added from gallery:', result.assets.length);

        // Trigger success haptic feedback
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        ).catch(() => {
          // Silently fail if haptics not supported
        });
      }
    } catch (error: any) {
      console.error('[PhotoCapture] Error selecting from gallery:', error);

      // Trigger error haptic feedback
      await Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Error
      ).catch(() => {
        // Silently fail if haptics not supported
      });

      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.', [
        { text: 'OK' },
      ]);
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    Alert.alert(
      'Xóa ảnh',
      'Bạn có chắc chắn muốn xóa ảnh này?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            await removePhoto(photoId);
            console.log('[PhotoCapture] Photo removed:', photoId);
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleNext = () => {
    if (currentPhotos.length === 0) {
      Alert.alert(
        'Thông báo',
        'Vui lòng chụp ít nhất 1 ảnh trước khi tiếp tục',
        [{ text: 'OK' }]
      );
      return;
    }

    // Move to next step
    setStep('info');

    // Navigate to owner info screen
    navigation.navigate('OwnerInfo', { surveyId: route.params.surveyId });
  };

  const handleBack = () => {
    Alert.alert(
      'Quay lại',
      'Các ảnh đã chụp sẽ được lưu trong bản nháp. Bạn có muốn quay lại?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Quay lại',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.special.white} />
        </TouchableOpacity>
        <H3 color="white" style={styles.headerTitle}>
          Chụp ảnh
        </H3>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
              <View style={[styles.progressDot, styles.progressDotComplete]}>
                <Feather name="check" size={8} color={theme.colors.special.white} />
              </View>
              <Label color="primary" style={styles.progressLabel}>
                GPS
              </Label>
            </View>
            <View style={[styles.progressLine, styles.progressLineComplete]} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Label color="primary" style={styles.progressLabel}>
                Hình ảnh
              </Label>
            </View>
          </View>
        </View>

        {/* Photo Count */}
        <View style={styles.photoCountSection}>
          <Badge variant={currentPhotos.length > 0 ? 'success' : 'primary'} size={48}>
            <Body color="white" style={styles.photoCountText}>
              {currentPhotos.length}
            </Body>
          </Badge>
          <Body color="primary" style={styles.photoCountLabel}>
            {currentPhotos.length === 0
              ? 'Chưa có ảnh nào'
              : `${currentPhotos.length} ảnh đã chụp`}
          </Body>
          <Label color="primary" style={styles.photoCountHint}>
            (Tối đa 5 ảnh, đã dùng {currentPhotos.length}/5)
          </Label>
        </View>

        {/* Capture Buttons */}
        <View style={styles.captureSection}>
          <Button
            variant="secondary"
            onPress={capturePhoto}
            disabled={!hasPermission || isCapturing || currentPhotos.length >= 5}
            icon={<Feather name="camera" size={20} color={theme.colors.special.white} />}
            style={styles.captureButton}
          >
            {isCapturing ? 'Đang chụp...' : 'Chụp ảnh'}
          </Button>

          <Button
            variant="outline"
            onPress={selectFromGallery}
            disabled={currentPhotos.length >= 5}
            icon={<Feather name="image" size={20} color={theme.colors.primary[600]} />}
            style={styles.captureButton}
          >
            Chọn từ thư viện
          </Button>
        </View>

        {/* Photo Grid */}
        {currentPhotos.length > 0 && (
          <View style={styles.photoGrid}>
            {currentPhotos.map((photo) => (
              <View key={photo.id} style={styles.photoCard}>
                <Image
                  source={{ uri: photo.filePath }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(photo.id)}
                  activeOpacity={0.8}
                >
                  <Feather name="x" size={16} color={theme.colors.special.white} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="info" size={16} color={theme.colors.info[600]} />
            <Body color="primary" style={styles.infoText}>
              Chụp nhiều góc độ khác nhau của địa điểm để tăng tính chính xác.
              Ảnh nên rõ ràng, đủ sáng và thể hiện đầy đủ đặc điểm của địa điểm.
            </Body>
          </View>
        </Card>
      </ScrollView>

      {/* Footer Actions */}
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
          disabled={currentPhotos.length === 0}
        >
          Tiếp tục
        </Button>
      </View>
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
  },
  contentContainer: {
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
  photoCountSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  photoCountText: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
  },
  photoCountLabel: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  photoCountHint: {
    marginTop: theme.spacing.xs,
    opacity: 0.6,
  },
  captureSection: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.base,
  },
  captureButton: {
    width: '100%',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.base,
    marginBottom: theme.spacing.base,
  },
  photoCard: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: theme.colors.neutral[200],
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    backgroundColor: theme.colors.error[500],
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  infoCard: {
    padding: theme.spacing.base,
    backgroundColor: theme.colors.info[50],
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info[600],
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
