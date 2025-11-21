/**
 * HistoryScreen - Display past surveys (synced and unsynced)
 * Shows both successfully synced surveys from backend and pending local surveys
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SafeScreen, Card, Body, BodySmall, Caption, Badge } from '../components';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { supabase } from '../services/supabase';
import { SurveyLocation } from '../types/survey';
import { Ionicons } from '@expo/vector-icons';

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList, 'History'>;

interface HistoryItem {
  id: string;
  localId?: string;
  tempName: string | null;
  objectType: string | null;
  landUseType: string | null;
  address: string | null;
  status: 'synced' | 'pending' | 'failed';
  createdAt: string;
  syncedAt?: string | null;
  photoCount?: number;
  hasPolygon?: boolean;
}

export const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const { user } = useAuthStore();
  const { queue, isOnline } = useSyncStore();

  const [surveys, setSurveys] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch surveys from backend and merge with local queue
  const fetchSurveys = useCallback(async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const allSurveys: HistoryItem[] = [];

      // 1. Fetch synced surveys from Supabase (if online)
      if (isOnline && user?.id) {
        const { data: syncedSurveys, error } = await supabase
          .from('survey_locations')
          .select('id, temp_name, object_type_code, land_use_type_code, raw_address, status, created_at, submitted_at, has_rough_area, client_local_id')
          .eq('created_by', user.id)
          .order('created_at', { ascending: false })
          .limit(100);

        if (error) {
          console.error('[HistoryScreen] Error fetching synced surveys:', error);
        } else if (syncedSurveys && Array.isArray(syncedSurveys)) {
          // Get photo counts for each survey
          for (const survey of syncedSurveys as any[]) {
            const { count } = await supabase
              .from('survey_media')
              .select('*', { count: 'exact', head: true })
              .eq('survey_location_id', survey.id);

            allSurveys.push({
              id: survey.id,
              localId: survey.client_local_id || undefined,
              tempName: survey.temp_name,
              objectType: survey.object_type_code,
              landUseType: survey.land_use_type_code,
              address: survey.raw_address,
              status: 'synced',
              createdAt: survey.created_at,
              syncedAt: survey.submitted_at,
              photoCount: count || 0,
              hasPolygon: survey.has_rough_area,
            });
          }
        }
      }

      // 2. Add pending surveys from sync queue
      queue.forEach((item) => {
        if (item.type === 'survey' && item.data) {
          allSurveys.push({
            id: item.data.clientLocalId || item.data.id || item.id,
            localId: item.data.clientLocalId || item.data.id,
            tempName: item.data.tempName || null,
            objectType: item.data.objectTypeCode || null,
            landUseType: item.data.landUseTypeCode || null,
            address: item.data.rawAddress || null,
            status: item.retryCount >= item.maxRetries ? 'failed' : 'pending',
            createdAt: item.data.createdAt || item.createdAt,
            photoCount: item.data.photos?.length || 0,
            hasPolygon: item.data.vertices && item.data.vertices.length >= 3,
          });
        }
      });

      // 3. Sort by creation date (newest first)
      allSurveys.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setSurveys(allSurveys);
    } catch (error) {
      console.error('[HistoryScreen] Error loading surveys:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử khảo sát');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isOnline, user, queue]);

  // Load surveys on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchSurveys();
    }, [fetchSurveys])
  );

  // Refresh on pull down
  const handleRefresh = () => {
    fetchSurveys(true);
  };

  // Handle survey item press (future: navigate to detail view)
  const handleSurveyPress = (survey: HistoryItem) => {
    Alert.alert(
      'Chi tiết khảo sát',
      `Tên: ${survey.tempName || 'Chưa đặt tên'}\n` +
      `Địa chỉ: ${survey.address || 'Chưa có'}\n` +
      `Trạng thái: ${getStatusText(survey.status)}\n` +
      `Ảnh: ${survey.photoCount || 0}\n` +
      `Vùng ranh: ${survey.hasPolygon ? 'Có' : 'Không'}`,
      [{ text: 'Đóng' }]
    );
  };

  // Get status display text
  const getStatusText = (status: string) => {
    switch (status) {
      case 'synced':
        return 'Đã đồng bộ';
      case 'pending':
        return 'Chờ đồng bộ';
      case 'failed':
        return 'Thất bại';
      default:
        return status;
    }
  };

  // Get status badge color
  const getStatusColor = (status: string): 'success' | 'warning' | 'error' => {
    switch (status) {
      case 'synced':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'warning';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
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

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Render survey item
  const renderSurveyItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity onPress={() => handleSurveyPress(item)}>
      <Card style={styles.surveyCard}>
        <View style={styles.surveyHeader}>
          <View style={styles.surveyTitle}>
            <Ionicons
              name="location"
              size={20}
              color={theme.colors.primary[600]}
              style={styles.icon}
            />
            <Body style={styles.surveyName}>
              {item.tempName || 'Chưa đặt tên'}
            </Body>
          </View>
          <Badge variant={getStatusColor(item.status)}>
            {getStatusText(item.status)}
          </Badge>
        </View>

        {item.address && (
          <View style={styles.surveyDetail}>
            <Ionicons
              name="home-outline"
              size={16}
              color={theme.colors.neutral[600]}
              style={styles.detailIcon}
            />
            <BodySmall color="secondary" style={styles.detailText}>
              {item.address}
            </BodySmall>
          </View>
        )}

        <View style={styles.surveyMeta}>
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={16}
              color={theme.colors.neutral[600]}
            />
            <BodySmall color="secondary" style={styles.metaText}>
              {formatDate(item.createdAt)}
            </BodySmall>
          </View>

          {item.photoCount !== undefined && item.photoCount > 0 && (
            <View style={styles.metaItem}>
              <Ionicons
                name="camera-outline"
                size={16}
                color={theme.colors.neutral[600]}
              />
              <BodySmall color="secondary" style={styles.metaText}>
                {item.photoCount} ảnh
              </BodySmall>
            </View>
          )}

          {item.hasPolygon && (
            <View style={styles.metaItem}>
              <Ionicons
                name="git-network-outline"
                size={16}
                color={theme.colors.neutral[600]}
              />
              <BodySmall color="secondary" style={styles.metaText}>
                Có vùng ranh
              </BodySmall>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color={theme.colors.neutral[400]}
      />
      <Body color="secondary" style={styles.emptyText}>
        Chưa có khảo sát nào
      </Body>
      <BodySmall color="secondary" style={styles.emptyHint}>
        Các khảo sát đã thực hiện sẽ xuất hiện tại đây
      </BodySmall>
    </View>
  );

  return (
    <SafeScreen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.special.white} />
        </TouchableOpacity>
        <Body style={styles.headerTitle}>Lịch sử khảo sát</Body>
      </View>

      <View style={styles.container}>
        {isLoading && !isRefreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary[600]} />
            <Body color="secondary" style={styles.loadingText}>
              Đang tải...
            </Body>
          </View>
        ) : (
          <FlatList
            data={surveys}
            keyExtractor={(item) => item.id}
            renderItem={renderSurveyItem}
            ListEmptyComponent={renderEmpty}
            contentContainerStyle={
              surveys.length === 0 ? styles.emptyList : styles.list
            }
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[theme.colors.primary[600]]}
                tintColor={theme.colors.primary[600]}
              />
            }
          />
        )}
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary[600],
    paddingTop: theme.spacing.base,
    paddingBottom: theme.spacing.base,
    paddingHorizontal: theme.spacing.base,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
    ...theme.shadows.primary,
  },
  backButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  headerTitle: {
    color: theme.colors.special.white,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    flex: 1,
  },
  container: {
    flex: 1,
  },
  list: {
    padding: theme.spacing.base,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.base,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  emptyHint: {
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  surveyCard: {
    marginBottom: theme.spacing.base,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  surveyTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  surveyName: {
    flex: 1,
    fontWeight: '600',
  },
  surveyDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  detailIcon: {
    marginRight: theme.spacing.xs,
    marginTop: 2,
  },
  detailText: {
    flex: 1,
  },
  surveyMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.base,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs / 2,
  },
  metaText: {
    marginLeft: theme.spacing.xs / 2,
  },
});
