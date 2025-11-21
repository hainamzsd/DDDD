/**
 * Drafts Screen - List and manage incomplete surveys
 * Allows resuming or deleting draft surveys
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import {
  H3,
  H4,
  Body,
  Label,
  Card,
  Badge,
} from '../components';
import { useSurveyStore } from '../store/surveyStore';
import { getAllDrafts, deleteDraft } from '../store/surveyStore';
import type { RootStackParamList } from '../navigation/AppNavigator';

type DraftsNavigationProp = StackNavigationProp<RootStackParamList, 'Drafts'>;

interface DraftItem {
  surveyId: string;
  locationName?: string;
  objectType?: string;
  hasGPS: boolean;
  photoCount: number;
  hasPolygon: boolean;
  savedAt: string;
  updatedAt: string;
}

const DRAFT_STORAGE_PREFIX = '@survey_draft_';

export const DraftsScreen: React.FC = () => {
  const navigation = useNavigation<DraftsNavigationProp>();
  const { loadDraft, setStep } = useSurveyStore();
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDrafts = async () => {
    try {
      const draftIds = await getAllDrafts();
      const draftItems: DraftItem[] = [];

      for (const surveyId of draftIds) {
        try {
          const key = `${DRAFT_STORAGE_PREFIX}${surveyId}`;
          const draftJson = await AsyncStorage.getItem(key);
          if (!draftJson) continue;

          const draft = JSON.parse(draftJson);
          const { survey, photos, vertices, savedAt } = draft;

          draftItems.push({
            surveyId,
            locationName: survey.locationName,
            objectType: survey.objectType,
            hasGPS: !!survey.gpsPoint,
            photoCount: photos?.length || 0,
            hasPolygon: vertices?.length >= 3,
            savedAt: savedAt || survey.createdAt,
            updatedAt: survey.updatedAt || survey.createdAt,
          });
        } catch (error) {
          console.error(`[DraftsScreen] Failed to load draft ${surveyId}:`, error);
        }
      }

      // Sort by most recently updated first
      draftItems.sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

      setDrafts(draftItems);
    } catch (error) {
      console.error('[DraftsScreen] Failed to load drafts:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách bản nháp');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load drafts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDrafts();
    }, [])
  );

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDrafts();
  };

  const handleResumeDraft = async (surveyId: string) => {
    try {
      await loadDraft(surveyId);

      // Determine which step to navigate to based on draft completeness
      const key = `${DRAFT_STORAGE_PREFIX}${surveyId}`;
      const draftJson = await AsyncStorage.getItem(key);
      if (!draftJson) return;

      const draft = JSON.parse(draftJson);
      const { survey, photos } = draft;

      // Navigate to appropriate step
      if (!survey.gpsPoint) {
        setStep('gps');
        navigation.navigate('GPSCapture', { surveyId });
      } else if (!photos || photos.length === 0) {
        setStep('photos');
        navigation.navigate('PhotoCapture', { surveyId });
      } else if (!survey.locationName) {
        setStep('info');
        navigation.navigate('OwnerInfo', { surveyId });
      } else if (!survey.landUseTypeCode) {
        setStep('usage');
        navigation.navigate('UsageInfo', { surveyId });
      } else {
        // Go to review if most data is complete
        setStep('review');
        navigation.navigate('ReviewSubmit', { surveyId });
      }
    } catch (error: any) {
      console.error('[DraftsScreen] Failed to resume draft:', error);
      Alert.alert('Lỗi', error.message || 'Không thể tải bản nháp');
    }
  };

  const handleDeleteDraft = (surveyId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa bản nháp này? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDraft(surveyId);
              setDrafts(drafts.filter(d => d.surveyId !== surveyId));
            } catch (error) {
              console.error('[DraftsScreen] Failed to delete draft:', error);
              Alert.alert('Lỗi', 'Không thể xóa bản nháp');
            }
          },
        },
      ]
    );
  };

  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  };

  const renderDraftCard = (draft: DraftItem) => {
    const completionItems = [
      draft.hasGPS,
      draft.photoCount > 0,
      !!draft.locationName,
    ].filter(Boolean).length;
    const totalItems = 3; // GPS, Photos, Location Name (minimum required)
    const completionPercent = Math.round((completionItems / totalItems) * 100);

    return (
      <Card key={draft.surveyId} style={styles.draftCard}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleResumeDraft(draft.surveyId)}
        >
          <View style={styles.draftHeader}>
            <View style={styles.draftHeaderLeft}>
              <Badge variant="warning" size={40}>
                <Feather name="edit" size={20} color={theme.colors.special.white} />
              </Badge>
              <View style={styles.draftInfo}>
                <H4 color="primary">
                  {draft.locationName || 'Chưa đặt tên'}
                </H4>
                {draft.objectType && (
                  <Label color="primary" style={styles.objectType}>
                    {draft.objectType}
                  </Label>
                )}
                <Label color="primary" style={styles.timestamp}>
                  {formatRelativeTime(draft.updatedAt)}
                </Label>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => handleDeleteDraft(draft.surveyId)}
              hitSlop={8}
              style={styles.deleteButton}
            >
              <Feather name="trash-2" size={20} color={theme.colors.error[500]} />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Label color="primary">Tiến độ hoàn thành</Label>
              <Label color="primary" style={styles.progressPercent}>
                {completionPercent}%
              </Label>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${completionPercent}%` }
                ]}
              />
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Feather
                name="map-pin"
                size={16}
                color={draft.hasGPS ? theme.colors.success[500] : theme.colors.neutral[400]}
              />
              <Label
                color={draft.hasGPS ? 'success' : 'primary'}
                style={styles.statLabel}
              >
                GPS
              </Label>
            </View>
            <View style={styles.stat}>
              <Feather
                name="camera"
                size={16}
                color={draft.photoCount > 0 ? theme.colors.success[500] : theme.colors.neutral[400]}
              />
              <Label
                color={draft.photoCount > 0 ? 'success' : 'primary'}
                style={styles.statLabel}
              >
                {draft.photoCount} ảnh
              </Label>
            </View>
            {draft.hasPolygon && (
              <View style={styles.stat}>
                <Feather name="map" size={16} color={theme.colors.info[500]} />
                <Label color="info" style={styles.statLabel}>
                  Đa giác
                </Label>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Custom Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={24} color={theme.colors.special.white} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <H3 color="white">Bản nháp</H3>
          <Label color="white" style={styles.headerSubtitle}>
            {drafts.length} khảo sát chưa hoàn thành
          </Label>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary[600]]}
            tintColor={theme.colors.primary[600]}
          />
        }
      >
        {drafts.length === 0 && !isLoading ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Feather name="folder" size={64} color={theme.colors.neutral[400]} />
            </View>
            <H3 color="primary" style={styles.emptyTitle}>
              Không có bản nháp
            </H3>
            <Body color="primary" style={styles.emptyText}>
              Các khảo sát chưa hoàn thành sẽ được lưu tự động và hiển thị ở đây
            </Body>
          </View>
        ) : (
          <>
            <View style={styles.infoCard}>
              <Feather name="info" size={16} color={theme.colors.info[600]} />
              <Body color="primary" style={styles.infoText}>
                Các bản nháp được lưu tự động khi bạn điền thông tin. Chạm vào để tiếp tục hoàn thành.
              </Body>
            </View>

            {drafts.map(renderDraftCard)}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[100],
  },
  header: {
    backgroundColor: theme.colors.primary[600],
    paddingTop: 32,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: theme.borderRadius['2xl'],
    borderBottomRightRadius: theme.borderRadius['2xl'],
    ...theme.shadows.primary,
  },
  backButton: {
    marginRight: theme.spacing.base,
    padding: theme.spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing['2xl'],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.info[50],
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.base,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.info[600],
  },
  infoText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSize.sm,
    lineHeight: 20,
  },
  draftCard: {
    padding: theme.spacing.base,
    marginBottom: theme.spacing.base,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  draftHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  draftInfo: {
    marginLeft: theme.spacing.base,
    flex: 1,
  },
  objectType: {
    fontSize: theme.typography.fontSize.sm,
    marginTop: 2,
    opacity: 0.7,
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: 4,
    opacity: 0.5,
  },
  deleteButton: {
    padding: theme.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginVertical: theme.spacing.base,
  },
  progressSection: {
    marginBottom: theme.spacing.base,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  progressPercent: {
    fontWeight: '600',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent[500],
    borderRadius: theme.borderRadius.full,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.base,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral[100],
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
  },
  statLabel: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing['3xl'],
  },
  emptyIconContainer: {
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.base,
  },
  emptyTitle: {
    marginTop: theme.spacing.lg,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: theme.spacing.xl,
  },
});
