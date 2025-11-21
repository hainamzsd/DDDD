/**
 * Start Survey Screen
 * Initialize a new survey with basic information
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '../store/authStore';
import { useSurveyStore } from '../store/surveyStore';
import { getObjectTypes } from '../services/referenceData';
import { theme } from '../theme';
import {
  H1,
  H3,
  Body,
  Label,
  Button,
  Input,
  Card,
  Badge,
} from '../components';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { ObjectType } from '../types/survey';

type StartSurveyNavigationProp = StackNavigationProp<
  RootStackParamList,
  'StartSurvey'
>;

export const StartSurveyScreen: React.FC = () => {
  const navigation = useNavigation<StartSurveyNavigationProp>();
  const { user } = useAuthStore();
  const { startNewSurvey, updateSurvey, setStep, currentSurvey } = useSurveyStore();

  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load object types on mount
  useEffect(() => {
    loadObjectTypes();
  }, []);

  const loadObjectTypes = async () => {
    setIsLoading(true);
    try {
      const types = await getObjectTypes();
      setObjectTypes(types);
    } catch (error) {
      console.error('[StartSurvey] Failed to load object types:', error);
      Alert.alert(
        'Lỗi',
        'Không thể tải danh sách loại đối tượng. Vui lòng thử lại.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectType = (typeCode: string) => {
    setSelectedType(typeCode);
  };

  const handleNext = async () => {
    // Validation
    if (!selectedType) {
      Alert.alert('Thông báo', 'Vui lòng chọn loại đối tượng', [{ text: 'OK' }]);
      return;
    }

    try {
      // Start new survey if not already started
      if (!currentSurvey) {
        startNewSurvey(user?.id || '');
      }

      // Update survey with basic info
      await updateSurvey({
        objectTypeCode: selectedType,
        tempName: tempName.trim() || null,
        description: description.trim() || null,
        // Set user's unit codes (these would come from user profile)
        provinceCode: user?.provinceCode || '01', // Default to Hanoi
        districtCode: user?.districtCode || '001',
        wardCode: user?.wardCode || '00001',
      });

      // Move to next step
      setStep('gps');

      // Navigate to GPS capture screen
      navigation.navigate('GPSCapture', {
        surveyId: currentSurvey?.clientLocalId || '',
      });
    } catch (error: any) {
      console.error('[StartSurvey] Error:', error);
      Alert.alert('Lỗi', error.message || 'Không thể bắt đầu khảo sát', [
        { text: 'OK' },
      ]);
    }
  };

  const handleCancel = () => {
    Alert.alert(
      'Hủy khảo sát',
      'Bạn có chắc chắn muốn hủy?',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
      { cancelable: true }
    );
  };

  const getTypeIcon = (typeCode: string): keyof typeof Feather.glyphMap => {
    const iconMap: Record<string, keyof typeof Feather.glyphMap> = {
      HOUSE: 'home',
      SHOP: 'shopping-bag',
      OFFICE: 'briefcase',
      FACTORY: 'package',
      SCHOOL: 'book',
      HOSPITAL: 'activity',
      TEMPLE: 'compass',
      PARK: 'sun',
      OTHER: 'circle',
    };
    return iconMap[typeCode] || 'circle';
  };

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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Feather name="x" size={24} color={theme.colors.special.white} />
        </TouchableOpacity>
        <H3 color="white" style={styles.headerTitle}>
          Bắt đầu khảo sát mới
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
            <View style={[styles.progressStep, styles.progressStepActive]}>
              <View style={styles.progressDot} />
              <Label color="primary" style={styles.progressLabel}>
                Thông tin
              </Label>
            </View>
            <View style={styles.progressLine} />
            <View style={styles.progressStep}>
              <View style={[styles.progressDot, styles.progressDotInactive]} />
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

        {/* Object Type Selection */}
        <View style={styles.section}>
          <H3 color="primary" style={styles.sectionTitle}>
            Loại đối tượng <Body color="secondary">*</Body>
          </H3>
          <Body color="primary" style={styles.sectionDescription}>
            Chọn loại địa điểm cần khảo sát
          </Body>

          <View style={styles.typeGrid}>
            {objectTypes.map((type) => (
              <TouchableOpacity
                key={type.code}
                style={[
                  styles.typeCard,
                  selectedType === type.code ? styles.typeCardSelected : undefined,
                ]}
                onPress={() => handleSelectType(type.code)}
                activeOpacity={0.7}
              >
                <Badge
                  variant={selectedType === type.code ? 'secondary' : 'primary'}
                  size={48}
                >
                  <Feather
                    name={getTypeIcon(type.code)}
                    size={24}
                    color={theme.colors.special.white}
                  />
                </Badge>
                <Body
                  color="primary"
                  style={[
                    styles.typeName,
                    selectedType === type.code ? styles.typeNameSelected : undefined,
                  ]}
                >
                  {type.nameVi}
                </Body>
                {type.description && (
                  <Label color="primary" style={styles.typeDescription}>
                    {type.description}
                  </Label>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Optional Info */}
        <View style={styles.section}>
          <H3 color="primary" style={styles.sectionTitle}>
            Thông tin bổ sung (tùy chọn)
          </H3>

          <Input
            label="Tên tạm thời"
            placeholder="VD: Nhà số 123 đường ABC"
            value={tempName}
            onChangeText={setTempName}
            leftIcon={<Feather name="edit-3" size={20} color={theme.colors.primary[400]} />}
          />

          <Input
            label="Ghi chú"
            placeholder="Mô tả hoặc ghi chú về địa điểm"
            value={description}
            onChangeText={setDescription}
            multiline={true}
            numberOfLines={3}
            leftIcon={<Feather name="file-text" size={20} color={theme.colors.primary[400]} />}
          />
        </View>

        {/* Info Card */}
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Feather name="info" size={16} color={theme.colors.info[600]} />
            <Body color="primary" style={styles.infoText}>
              Sau khi chọn loại đối tượng, bạn sẽ tiếp tục thu thập tọa độ GPS và hình ảnh.
            </Body>
          </View>
        </Card>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <Button
          variant="outline"
          onPress={handleCancel}
          style={styles.footerButton}
        >
          Hủy
        </Button>
        <Button
          variant="secondary"
          onPress={handleNext}
          style={styles.footerButton}
          icon={<Feather name="arrow-right" size={20} color={theme.colors.special.white} />}
          disabled={!selectedType}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
  },
  loadingText: {
    marginTop: theme.spacing.base,
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
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: theme.typography.fontSize.sm,
    opacity: 0.7,
    marginBottom: theme.spacing.base,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.base,
    marginTop: theme.spacing.base,
  },
  typeCard: {
    width: '48%',
    backgroundColor: theme.colors.special.white,
    padding: theme.spacing.base,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...theme.shadows.sm,
  },
  typeCardSelected: {
    borderColor: theme.colors.secondary[500],
    backgroundColor: theme.colors.secondary[50],
  },
  typeName: {
    fontWeight: '600',
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  typeNameSelected: {
    color: theme.colors.secondary[700],
  },
  typeDescription: {
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
    opacity: 0.6,
    marginTop: 2,
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
