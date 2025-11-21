/**
 * Owner Info Screen
 * Capture owner/representative information and location details
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useSurveyStore } from '../store/surveyStore';
import { theme } from '../theme';
import {
  H3,
  Body,
  Label,
  Button,
  Input,
  Card,
} from '../components';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  validateRequiredText,
  validateOwnerIdNumber,
  validatePhoneNumber,
} from '../utils/validation';

type OwnerInfoNavigationProp = StackNavigationProp<
  RootStackParamList,
  'OwnerInfo'
>;

type OwnerInfoRouteProp = RouteProp<RootStackParamList, 'OwnerInfo'>;

export const OwnerInfoScreen: React.FC = () => {
  const navigation = useNavigation<OwnerInfoNavigationProp>();
  const route = useRoute<OwnerInfoRouteProp>();
  const { currentSurvey, updateSurvey, setStep } = useSurveyStore();

  // Form state
  const [locationName, setLocationName] = useState(currentSurvey?.tempName || '');
  const [ownerName, setOwnerName] = useState('');
  const [ownerIdNumber, setOwnerIdNumber] = useState('');
  const [houseNumber, setHouseNumber] = useState(currentSurvey?.houseNumber || '');
  const [streetName, setStreetName] = useState(currentSurvey?.streetName || '');
  const [rawAddress, setRawAddress] = useState(currentSurvey?.rawAddress || '');
  const [description, setDescription] = useState(currentSurvey?.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Load existing data if available
    if (currentSurvey) {
      setLocationName(currentSurvey.tempName || '');
      setHouseNumber(currentSurvey.houseNumber || '');
      setStreetName(currentSurvey.streetName || '');
      setRawAddress(currentSurvey.rawAddress || '');
      setDescription(currentSurvey.description || '');
    }
  }, [currentSurvey]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate location name (required)
    const locationNameValidation = validateRequiredText(
      locationName,
      'Tên địa điểm',
      2,
      200
    );
    if (!locationNameValidation.isValid) {
      newErrors.locationName = locationNameValidation.errorMessage!;
    }

    // Validate address (at least one of: house number, street name, or full address)
    if (!houseNumber.trim() && !streetName.trim() && !rawAddress.trim()) {
      newErrors.address = 'Vui lòng nhập ít nhất một thông tin địa chỉ';
    }

    // Validate house number if provided
    if (houseNumber.trim()) {
      const houseNumValidation = validateRequiredText(
        houseNumber,
        'Số nhà',
        1,
        20
      );
      if (!houseNumValidation.isValid) {
        newErrors.houseNumber = houseNumValidation.errorMessage!;
      }
    }

    // Validate street name if provided
    if (streetName.trim()) {
      const streetValidation = validateRequiredText(
        streetName,
        'Tên đường',
        2,
        100
      );
      if (!streetValidation.isValid) {
        newErrors.streetName = streetValidation.errorMessage!;
      }
    }

    // Validate owner name if provided
    if (ownerName.trim()) {
      const ownerNameValidation = validateRequiredText(
        ownerName,
        'Họ và tên',
        2,
        100
      );
      if (!ownerNameValidation.isValid) {
        newErrors.ownerName = ownerNameValidation.errorMessage!;
      }
    }

    // Validate owner ID number if provided (using regulatory validation)
    if (ownerIdNumber.trim()) {
      const idValidation = validateOwnerIdNumber(ownerIdNumber);
      if (!idValidation.isValid) {
        newErrors.ownerIdNumber = idValidation.errorMessage!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateForm()) {
      Alert.alert('Lỗi xác thực', 'Vui lòng kiểm tra lại thông tin đã nhập', [
        { text: 'OK' },
      ]);
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the full address from components
      let fullAddress = rawAddress.trim();
      if (!fullAddress && (houseNumber.trim() || streetName.trim())) {
        const parts = [];
        if (houseNumber.trim()) parts.push(`Số ${houseNumber.trim()}`);
        if (streetName.trim()) parts.push(streetName.trim());
        fullAddress = parts.join(', ');
      }

      // Prepare description with owner info
      let fullDescription = description.trim();
      if (ownerName.trim() || ownerIdNumber.trim()) {
        const ownerInfo = [];
        if (ownerName.trim()) ownerInfo.push(`Chủ sở hữu: ${ownerName.trim()}`);
        if (ownerIdNumber.trim()) ownerInfo.push(`CCCD/CMND: ${ownerIdNumber.trim()}`);

        const ownerText = ownerInfo.join(', ');
        fullDescription = fullDescription
          ? `${ownerText}\n${fullDescription}`
          : ownerText;
      }

      // Update survey with owner info
      await updateSurvey({
        tempName: locationName.trim(),
        houseNumber: houseNumber.trim() || null,
        streetName: streetName.trim() || null,
        rawAddress: fullAddress || null,
        description: fullDescription || null,
      });

      console.log('[OwnerInfo] Updated survey with owner info');

      // Move to next step (Usage Info)
      setStep('usage');

      // Navigate to Usage Info screen
      navigation.navigate('UsageInfo', { surveyId: route.params.surveyId });
    } catch (error: any) {
      console.error('[OwnerInfo] Error saving owner info:', error);
      Alert.alert('Lỗi', 'Không thể lưu thông tin. Vui lòng thử lại.', [
        { text: 'OK' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    Alert.alert(
      'Quay lại',
      'Thông tin đã nhập sẽ được lưu trong bản nháp. Bạn có muốn quay lại?',
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.special.white} />
        </TouchableOpacity>
        <H3 color="white" style={styles.headerTitle}>
          Thông tin địa điểm
        </H3>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              <View style={[styles.progressDot, styles.progressDotComplete]}>
                <Feather name="check" size={8} color={theme.colors.special.white} />
              </View>
              <Label color="primary" style={styles.progressLabel}>
                Hình ảnh
              </Label>
            </View>
            <View style={[styles.progressLine, styles.progressLineComplete]} />
            <View style={styles.progressStep}>
              <View style={styles.progressDot} />
              <Label color="primary" style={styles.progressLabel}>
                Chi tiết
              </Label>
            </View>
          </View>
        </View>

        {/* Location Information Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="map-pin" size={20} color={theme.colors.primary[600]} />
            <Label color="primary" style={styles.sectionTitle}>
              Thông tin địa điểm
            </Label>
          </View>

          <View style={styles.formGroup}>
            <Label color="primary" style={styles.label}>
              Tên địa điểm <Label color="error">*</Label>
            </Label>
            <Input
              placeholder="Vd: Nhà số 10, Cửa hàng tạp hóa ABC..."
              value={locationName}
              onChangeText={setLocationName}
              error={errors.locationName}
            />
            {errors.locationName && (
              <Label color="error" style={styles.errorText}>
                {errors.locationName}
              </Label>
            )}
          </View>
        </Card>

        {/* Owner Information Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="user" size={20} color={theme.colors.primary[600]} />
            <Label color="primary" style={styles.sectionTitle}>
              Thông tin chủ sở hữu / Đại diện (Tùy chọn)
            </Label>
          </View>

          <View style={styles.formGroup}>
            <Label color="primary" style={styles.label}>
              Họ và tên
            </Label>
            <Input
              placeholder="Nhập họ tên chủ sở hữu hoặc đại diện"
              value={ownerName}
              onChangeText={setOwnerName}
              error={errors.ownerName}
            />
            {errors.ownerName && (
              <Label color="error" style={styles.errorText}>
                {errors.ownerName}
              </Label>
            )}
          </View>

          <View style={styles.formGroup}>
            <Label color="primary" style={styles.label}>
              Số CCCD/CMND
            </Label>
            <Input
              placeholder="Nhập số CCCD/CMND (9 hoặc 12 số)"
              value={ownerIdNumber}
              onChangeText={setOwnerIdNumber}
              keyboardType="number-pad"
              maxLength={12}
              error={errors.ownerIdNumber}
            />
            {errors.ownerIdNumber && (
              <Label color="error" style={styles.errorText}>
                {errors.ownerIdNumber}
              </Label>
            )}
          </View>
        </Card>

        {/* Address Information Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="home" size={20} color={theme.colors.primary[600]} />
            <Label color="primary" style={styles.sectionTitle}>
              Địa chỉ
            </Label>
          </View>

          <View style={styles.formGroup}>
            <Label color="primary" style={styles.label}>
              Số nhà
            </Label>
            <Input
              placeholder="Vd: 10, 12A, 45/2..."
              value={houseNumber}
              onChangeText={setHouseNumber}
              error={errors.houseNumber}
            />
            {errors.houseNumber && (
              <Label color="error" style={styles.errorText}>
                {errors.houseNumber}
              </Label>
            )}
          </View>

          <View style={styles.formGroup}>
            <Label color="primary" style={styles.label}>
              Tên đường
            </Label>
            <Input
              placeholder="Vd: Lê Lợi, Trần Hưng Đạo..."
              value={streetName}
              onChangeText={setStreetName}
              error={errors.streetName}
            />
            {errors.streetName && (
              <Label color="error" style={styles.errorText}>
                {errors.streetName}
              </Label>
            )}
          </View>

          <View style={styles.formGroup}>
            <Label color="primary" style={styles.label}>
              Địa chỉ đầy đủ
            </Label>
            <Input
              placeholder="Nhập địa chỉ đầy đủ (nếu khác với số nhà + tên đường)"
              value={rawAddress}
              onChangeText={setRawAddress}
              multiline
              numberOfLines={2}
            />
            {errors.address && (
              <Label color="error" style={styles.errorText}>
                {errors.address}
              </Label>
            )}
          </View>
        </Card>

        {/* Additional Notes Section */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="file-text" size={20} color={theme.colors.primary[600]} />
            <Label color="primary" style={styles.sectionTitle}>
              Ghi chú bổ sung (Tùy chọn)
            </Label>
          </View>

          <View style={styles.formGroup}>
            <Input
              placeholder="Nhập ghi chú, mô tả thêm về địa điểm..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />
          </View>
        </Card>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="info" size={16} color={theme.colors.info[600]} />
            <Body color="primary" style={styles.infoText}>
              Các trường có dấu (*) là bắt buộc. Thông tin chủ sở hữu và ghi chú là tùy chọn.
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang lưu...' : 'Tiếp tục'}
        </Button>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: theme.spacing.xl * 2,
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
  section: {
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.base,
  },
  sectionTitle: {
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
    fontSize: theme.typography.fontSize.base,
  },
  formGroup: {
    marginBottom: theme.spacing.base,
  },
  label: {
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  errorText: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
  },
  infoCard: {
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
