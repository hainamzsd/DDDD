/**
 * ReviewSubmitScreen - Review all survey data before submission
 * Displays comprehensive summary of collected data and validates completeness
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import {
  SafeScreen,
  Button,
  Card,
  Body,
  BodySmall,
  Caption,
  H3,
  Badge,
} from '../components';
import { theme } from '../theme';
import { useSurveyStore } from '../store/surveyStore';
import { useSyncStore } from '../store/syncStore';
import { LandUseType } from '../types/survey';
import { getLandUseTypes } from '../services/referenceData';

type ReviewSubmitScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ReviewSubmit'
>;
type ReviewSubmitScreenRouteProp = RouteProp<RootStackParamList, 'ReviewSubmit'>;

interface Props {
  navigation: ReviewSubmitScreenNavigationProp;
  route: ReviewSubmitScreenRouteProp;
}

export const ReviewSubmitScreen: React.FC<Props> = ({ navigation, route }) => {
  const { surveyId } = route.params;
  const { currentSurvey, currentPhotos, currentVertices, setStep, submitSurvey, clearCurrent } =
    useSurveyStore();
  const { isOnline } = useSyncStore();
  const [landUseType, setLandUseType] = useState<LandUseType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setStep('review');

    // Load land use type info
    const loadLandUseType = async () => {
      if (currentSurvey?.landUseTypeCode) {
        const types = await getLandUseTypes();
        const found = types.find((t) => t.code === currentSurvey.landUseTypeCode);
        if (found) {
          setLandUseType(found);
        }
      }
    };
    loadLandUseType();
  }, []);

  // Validate that all required data is present
  const validateSurvey = (): { valid: boolean; missing: string[] } => {
    const missing: string[] = [];

    if (!currentSurvey?.gpsPoint) {
      missing.push('Tọa độ GPS');
    }
    if (!currentPhotos || currentPhotos.length === 0) {
      missing.push('Hình ảnh');
    }
    if (!currentSurvey?.tempName) {
      missing.push('Tên địa điểm');
    }
    if (!currentSurvey?.rawAddress) {
      missing.push('Địa chỉ');
    }
    if (!currentSurvey?.landUseTypeCode) {
      missing.push('Loại sử dụng đất');
    }

    return {
      valid: missing.length === 0,
      missing,
    };
  };

  const handleSubmit = async () => {
    // Validate survey data
    const validation = validateSurvey();
    if (!validation.valid) {
      Alert.alert(
        'Thiếu thông tin',
        `Vui lòng bổ sung các thông tin sau:\n\n${validation.missing.join('\n')}`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirm submission
    Alert.alert(
      'Xác nhận gửi khảo sát',
      isOnline
        ? 'Bạn có chắc chắn muốn gửi khảo sát này không? Dữ liệu sẽ được đồng bộ ngay lập tức.'
        : 'Bạn đang ở chế độ ngoại tuyến. Khảo sát sẽ được lưu và đồng bộ khi có kết nối mạng.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Gửi',
          style: 'default',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              // Submit survey using the store method
              const result = await submitSurvey(isOnline);

              if (result.success) {
                // Clear current survey data
                clearCurrent();

                // Navigate to success screen
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'Dashboard' },
                    { name: 'SubmissionSuccess', params: { wasOnline: isOnline } },
                  ],
                });
              } else {
                throw new Error('Submission failed');
              }
            } catch (error: any) {
              Alert.alert(
                'Lỗi',
                error.message || 'Không thể gửi khảo sát. Vui lòng thử lại.',
                [{ text: 'OK' }]
              );
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (screen: keyof RootStackParamList) => {
    if (surveyId) {
      navigation.navigate(screen, { surveyId } as any);
    }
  };

  if (!currentSurvey) {
    return (
      <SafeScreen>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.special.white} />
          </TouchableOpacity>
          <Body style={styles.headerTitle}>Xem lại khảo sát</Body>
        </View>
        <View style={styles.emptyContainer}>
          <Body color="neutral">Không tìm thấy dữ liệu khảo sát</Body>
        </View>
      </SafeScreen>
    );
  }

  const validation = validateSurvey();

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.special.white} />
        </TouchableOpacity>
        <Body style={styles.headerTitle}>Xem lại khảo sát</Body>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <Badge
            variant={isOnline ? 'success' : 'warning'}
            size="medium"
          >
            {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
          </Badge>
          {!validation.valid && (
            <Badge
              variant="error"
              size="medium"
              style={styles.statusBadge}
            >
              Thiếu thông tin
            </Badge>
          )}
        </View>

        {/* GPS Information */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <H3>📍 Tọa độ GPS</H3>
            <TouchableOpacity onPress={() => handleEdit('GPSCapture')}>
              <Caption color="primary" style={styles.editLink}>
                Sửa
              </Caption>
            </TouchableOpacity>
          </View>

          {currentSurvey.gpsPoint ? (
            <>
              <Body style={styles.infoRow}>
                <Body style={styles.bold}>Vĩ độ: </Body>
                {currentSurvey.gpsPoint.coordinates[1].toFixed(6)}
              </Body>
              <Body style={styles.infoRow}>
                <Body style={styles.bold}>Kinh độ: </Body>
                {currentSurvey.gpsPoint.coordinates[0].toFixed(6)}
              </Body>
              {currentSurvey.gpsAccuracyM && (
                <BodySmall color="neutral" style={styles.infoRow}>
                  Độ chính xác: {currentSurvey.gpsAccuracyM.toFixed(1)}m
                </BodySmall>
              )}
            </>
          ) : (
            <Body color="error">❌ Chưa có tọa độ GPS</Body>
          )}
        </Card>

        {/* Photos */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <H3>📷 Hình ảnh ({currentPhotos.length})</H3>
            <TouchableOpacity onPress={() => handleEdit('PhotoCapture')}>
              <Caption color="primary" style={styles.editLink}>
                Sửa
              </Caption>
            </TouchableOpacity>
          </View>

          {currentPhotos.length > 0 ? (
            <View style={styles.photoGrid}>
              {currentPhotos.map((photo, index) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.localUri || photo.filePath }}
                  style={styles.thumbnail}
                />
              ))}
            </View>
          ) : (
            <Body color="error">❌ Chưa có hình ảnh</Body>
          )}
        </Card>

        {/* Location Info */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <H3>ℹ️ Thông tin địa điểm</H3>
            <TouchableOpacity onPress={() => handleEdit('OwnerInfo')}>
              <Caption color="primary" style={styles.editLink}>
                Sửa
              </Caption>
            </TouchableOpacity>
          </View>

          {currentSurvey.tempName ? (
            <>
              <Body style={styles.infoRow}>
                <Body style={styles.bold}>Tên: </Body>
                {currentSurvey.tempName}
              </Body>
              {currentSurvey.description && (
                <Body style={styles.infoRow}>
                  <Body style={styles.bold}>Mô tả: </Body>
                  {currentSurvey.description}
                </Body>
              )}
              {currentSurvey.rawAddress && (
                <Body style={styles.infoRow}>
                  <Body style={styles.bold}>Địa chỉ: </Body>
                  {currentSurvey.rawAddress}
                </Body>
              )}
              {currentSurvey.houseNumber && (
                <Body style={styles.infoRow}>
                  <Body style={styles.bold}>Số nhà: </Body>
                  {currentSurvey.houseNumber}
                </Body>
              )}
              {currentSurvey.streetName && (
                <Body style={styles.infoRow}>
                  <Body style={styles.bold}>Đường: </Body>
                  {currentSurvey.streetName}
                </Body>
              )}
            </>
          ) : (
            <Body color="error">❌ Chưa có thông tin địa điểm</Body>
          )}
        </Card>

        {/* Land Use Type */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <H3>🏞️ Loại sử dụng đất</H3>
            <TouchableOpacity onPress={() => handleEdit('UsageInfo')}>
              <Caption color="primary" style={styles.editLink}>
                Sửa
              </Caption>
            </TouchableOpacity>
          </View>

          {landUseType ? (
            <>
              <Body style={styles.infoRow}>
                <Body style={styles.bold}>Loại: </Body>
                {landUseType.nameVi}
              </Body>
              <BodySmall color="neutral" style={styles.infoRow}>
                Mã: {landUseType.code}
              </BodySmall>
              {landUseType.description && (
                <BodySmall color="neutral" style={styles.infoRow}>
                  {landUseType.description}
                </BodySmall>
              )}
            </>
          ) : (
            <Body color="error">❌ Chưa chọn loại sử dụng đất</Body>
          )}
        </Card>

        {/* Polygon */}
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <H3>📐 Vùng ranh giới</H3>
            <TouchableOpacity onPress={() => handleEdit('PolygonDraw')}>
              <Caption color="primary" style={styles.editLink}>
                Sửa
              </Caption>
            </TouchableOpacity>
          </View>

          {currentVertices.length >= 3 ? (
            <>
              <Body style={styles.infoRow}>
                <Body style={styles.bold}>Số điểm: </Body>
                {currentVertices.length}
              </Body>
              <BodySmall color="success">✓ Đã vẽ ranh giới</BodySmall>
            </>
          ) : (
            <BodySmall color="neutral">Không có ranh giới (tùy chọn)</BodySmall>
          )}
        </Card>

        {/* Validation Errors */}
        {!validation.valid && (
          <Card style={styles.errorCard}>
            <H3 color="error" style={styles.errorTitle}>
              ⚠️ Thiếu thông tin bắt buộc
            </H3>
            {validation.missing.map((item, index) => (
              <Body key={index} color="error" style={styles.errorItem}>
                • {item}
              </Body>
            ))}
            <BodySmall color="neutral" style={styles.errorHint}>
              Vui lòng nhấn "Sửa" ở các phần trên để bổ sung thông tin.
            </BodySmall>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button
          variant="secondary"
          onPress={() => navigation.goBack()}
          style={styles.buttonBack}
        >
          Quay lại
        </Button>
        <Button
          variant="primary"
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitButton}
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi khảo sát'}
        </Button>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[600],
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.base,
    paddingHorizontal: theme.spacing.base,
    ...theme.shadows.card,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.base,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.special.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.base,
    paddingBottom: theme.spacing.xl * 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.base,
  },
  statusContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.base,
  },
  statusBadge: {
    marginLeft: theme.spacing.sm,
  },
  card: {
    marginBottom: theme.spacing.base,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.base,
  },
  editLink: {
    textDecorationLine: 'underline',
  },
  bold: {
    fontWeight: '600',
  },
  infoRow: {
    marginTop: theme.spacing.sm,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[200],
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderColor: theme.colors.error[500],
    borderWidth: 1,
    marginBottom: theme.spacing.base,
  },
  errorTitle: {
    marginBottom: theme.spacing.sm,
  },
  errorItem: {
    marginTop: theme.spacing.xs,
  },
  errorHint: {
    marginTop: theme.spacing.base,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.base,
    backgroundColor: theme.colors.special.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    ...theme.shadows.card,
  },
  buttonBack: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  submitButton: {
    flex: 2,
  },
});
