/**
 * UsageInfoScreen - Land Use Type Selection
 * Allows officers to select the land use/cadastral category for the surveyed location
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SafeScreen } from '../components/SafeScreen';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { useSurveyStore } from '../store/surveyStore';
import { getLandUseTypes } from '../services/referenceData';
import { LandUseType } from '../types/survey';
import { validateLandUseTypeCode } from '../utils/validation';

type Props = NativeStackScreenProps<RootStackParamList, 'UsageInfo'>;

export const UsageInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { currentSurvey, updateSurvey } = useSurveyStore();

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<LandUseType[]>([]);
  const [subTypes, setSubTypes] = useState<LandUseType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubType, setSelectedSubType] = useState<string | null>(null);

  // Load land use categories on mount
  useEffect(() => {
    loadCategories();
  }, []);

  // Load sub-types when a category is selected
  useEffect(() => {
    if (selectedCategory) {
      loadSubTypes(selectedCategory);
    } else {
      setSubTypes([]);
      setSelectedSubType(null);
    }
  }, [selectedCategory]);

  // Initialize selected values from current survey
  useEffect(() => {
    if (currentSurvey?.landUseTypeCode) {
      // Find the selected type to determine if it's a category or subtype
      const allTypes = [...categories, ...subTypes];
      const selectedType = allTypes.find(t => t.code === currentSurvey.landUseTypeCode);

      if (selectedType) {
        if (selectedType.parentCode) {
          // It's a subtype
          setSelectedCategory(selectedType.parentCode);
          setSelectedSubType(selectedType.code);
        } else {
          // It's a category
          setSelectedCategory(selectedType.code);
        }
      }
    }
  }, [currentSurvey?.landUseTypeCode, categories, subTypes]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getLandUseTypes();
      // Filter to get only top-level categories (no parent)
      const topLevel = data.filter(type => !type.parentCode);
      setCategories(topLevel);
    } catch (error) {
      console.error('[UsageInfo] Failed to load categories:', error);
      Alert.alert('Lỗi', 'Không thể tải danh mục loại đất. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const loadSubTypes = async (categoryCode: string) => {
    try {
      const data = await getLandUseTypes();
      // Filter to get sub-types of the selected category
      const subs = data.filter(type => type.parentCode === categoryCode);
      setSubTypes(subs);
    } catch (error) {
      console.error('[UsageInfo] Failed to load sub-types:', error);
    }
  };

  const handleCategorySelect = (code: string) => {
    if (selectedCategory === code) {
      // Deselect
      setSelectedCategory(null);
      setSelectedSubType(null);
      updateSurvey({ landUseTypeCode: null });
    } else {
      // Select new category
      setSelectedCategory(code);
      setSelectedSubType(null);
      updateSurvey({ landUseTypeCode: code });
    }
  };

  const handleSubTypeSelect = (code: string) => {
    if (selectedSubType === code) {
      // Deselect - revert to category
      setSelectedSubType(null);
      updateSurvey({ landUseTypeCode: selectedCategory });
    } else {
      // Select subtype
      setSelectedSubType(code);
      updateSurvey({ landUseTypeCode: code });
    }
  };

  const handleNext = () => {
    if (!selectedCategory) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn loại đất/mục đích sử dụng.');
      return;
    }

    if (!currentSurvey?.clientLocalId) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin khảo sát.');
      return;
    }

    // Validate the selected land use type code
    const codeToValidate = selectedSubType || selectedCategory;
    const validation = validateLandUseTypeCode(codeToValidate);

    if (!validation.isValid) {
      Alert.alert(
        'Mã loại đất không hợp lệ',
        validation.errorMessage || 'Mã loại đất không đúng định dạng quy định.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Navigate to polygon drawing screen
    navigation.navigate('PolygonDraw', { surveyId: currentSurvey.clientLocalId });
  };

  const handleBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeScreen>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={24} color={theme.colors.primary[600]} />
          </TouchableOpacity>
          <Typography variant="h2" style={styles.headerTitle}>
            Thông tin sử dụng
          </Typography>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary[600]} />
          <Typography variant="body" style={styles.loadingText}>
            Đang tải danh mục...
          </Typography>
        </View>
      </SafeScreen>
    );
  }

  const getSelectedCategoryName = () => {
    if (!selectedCategory) return null;
    const cat = categories.find(c => c.code === selectedCategory);
    return cat?.nameVi;
  };

  const getSelectedSubTypeName = () => {
    if (!selectedSubType) return null;
    const sub = subTypes.find(s => s.code === selectedSubType);
    return sub?.nameVi;
  };

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={theme.colors.primary[600]} />
        </TouchableOpacity>
        <Typography variant="h2" style={styles.headerTitle}>
          Thông tin sử dụng
        </Typography>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Typography variant="h3" style={styles.sectionTitle}>
          Chọn loại đất / mục đích sử dụng
        </Typography>

        <Typography variant="body" style={styles.description}>
          Chọn danh mục loại đất phù hợp với vị trí đang khảo sát:
        </Typography>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          {categories.map((category) => {
            const isSelected = selectedCategory === category.code;
            const textStyle = isSelected
              ? StyleSheet.flatten([styles.categoryText, styles.categoryTextSelected])
              : styles.categoryText;
            const descStyle = isSelected
              ? StyleSheet.flatten([styles.categoryDescription, styles.categoryDescriptionSelected])
              : styles.categoryDescription;

            return (
              <TouchableOpacity
                key={category.code}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
                onPress={() => handleCategorySelect(category.code)}
              >
                <Typography
                  variant="body"
                  style={textStyle}
                >
                  {category.nameVi}
                </Typography>
                {category.description && (
                  <Typography
                    variant="caption"
                    style={descStyle}
                  >
                    {category.description}
                  </Typography>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sub-types (if category selected and has sub-types) */}
        {selectedCategory && subTypes.length > 0 && (
          <View style={styles.subTypesSection}>
            <Typography variant="h4" style={styles.subTypesTitle}>
              Loại chi tiết ({getSelectedCategoryName()})
            </Typography>
            <Typography variant="caption" style={styles.subTypesHint}>
              Tùy chọn: Chọn loại chi tiết hơn nếu có
            </Typography>

            <View style={styles.subTypesContainer}>
              {subTypes.map((subType) => {
                const isSelected = selectedSubType === subType.code;
                const subTypeTextStyle = isSelected
                  ? StyleSheet.flatten([styles.subTypeText, styles.subTypeTextSelected])
                  : styles.subTypeText;

                return (
                  <TouchableOpacity
                    key={subType.code}
                    style={[
                      styles.subTypeCard,
                      isSelected && styles.subTypeCardSelected,
                    ]}
                    onPress={() => handleSubTypeSelect(subType.code)}
                  >
                    <Typography
                      variant="body"
                      style={subTypeTextStyle}
                    >
                      {subType.nameVi}
                    </Typography>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Selected summary */}
        {selectedCategory && (
          <View style={styles.summaryContainer}>
            <Typography variant="caption" style={styles.summaryLabel}>
              Đã chọn:
            </Typography>
            <Typography variant="body" style={styles.summaryText}>
              {selectedSubType ? getSelectedSubTypeName() : getSelectedCategoryName()}
            </Typography>
          </View>
        )}
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <Button
          onPress={handleNext}
          variant="primary"
          disabled={!selectedCategory}
        >
          Tiếp tục
        </Button>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.special.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[200],
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.primary[600],
  },
  headerSpacer: {
    width: 40, // Same as back button to keep title centered
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
  },
  contentContainer: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    color: theme.colors.neutral[600],
  },
  sectionTitle: {
    marginBottom: theme.spacing.md,
    color: theme.colors.primary[600],
  },
  description: {
    marginBottom: theme.spacing.lg,
    color: theme.colors.neutral[700],
  },
  categoriesContainer: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  categoryCard: {
    backgroundColor: theme.colors.special.white,
    borderWidth: 2,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  categoryCardSelected: {
    borderColor: theme.colors.primary[600],
    backgroundColor: theme.colors.primary[50],
  },
  categoryText: {
    fontWeight: '600',
    color: theme.colors.neutral[900],
  },
  categoryTextSelected: {
    color: theme.colors.primary[700],
  },
  categoryDescription: {
    marginTop: theme.spacing.xs,
    color: theme.colors.neutral[600],
  },
  categoryDescriptionSelected: {
    color: theme.colors.primary[600],
  },
  subTypesSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[300],
  },
  subTypesTitle: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.neutral[900],
  },
  subTypesHint: {
    marginBottom: theme.spacing.md,
    color: theme.colors.neutral[600],
    fontStyle: 'italic',
  },
  subTypesContainer: {
    gap: theme.spacing.sm,
  },
  subTypeCard: {
    backgroundColor: theme.colors.special.white,
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
  },
  subTypeCardSelected: {
    borderColor: theme.colors.secondary[600],
    backgroundColor: theme.colors.secondary[50],
  },
  subTypeText: {
    color: theme.colors.neutral[800],
  },
  subTypeTextSelected: {
    color: theme.colors.secondary[700],
    fontWeight: '600',
  },
  summaryContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.accent[50],
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent[500],
  },
  summaryLabel: {
    color: theme.colors.neutral[700],
    marginBottom: theme.spacing.xs,
  },
  summaryText: {
    fontWeight: '600',
    color: theme.colors.primary[700],
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.special.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
  },
});
