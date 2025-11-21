import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SafeScreen } from '../components/SafeScreen';
import { Header } from '../components/Header';
import { theme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { useSyncStore } from '../store/syncStore';
import { dataExportService } from '../services/dataExport';
import * as cadastralUpdate from '../services/cadastralUpdate';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { user, signOut } = useAuthStore();
  const { isOnline, lastSyncTime, queue, sync } = useSyncStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [cadastralVersion, setCadastralVersion] = useState<string | null>(null);
  const [lastUpdateCheck, setLastUpdateCheck] = useState<Date | null>(null);

  const pendingCount = queue.filter((item) => item.retryCount < item.maxRetries).length;
  const failedCount = queue.filter((item) => item.retryCount >= item.maxRetries).length;

  // Load cadastral version on mount
  useEffect(() => {
    loadCadastralInfo();
  }, []);

  const loadCadastralInfo = async () => {
    const version = await cadastralUpdate.getCurrentVersion();
    const lastCheck = await cadastralUpdate.getLastUpdateCheck();
    setCadastralVersion(version);
    setLastUpdateCheck(lastCheck);
  };

  const handleCheckCadastralUpdates = async () => {
    if (!isOnline) {
      Alert.alert('Không có kết nối', 'Vui lòng kiểm tra kết nối mạng và thử lại.');
      return;
    }

    setIsCheckingUpdates(true);
    try {
      const updateAvailable = await cadastralUpdate.forceUpdateCheck();

      if (!updateAvailable) {
        Alert.alert('Đã cập nhật', 'Danh mục địa chính đã là phiên bản mới nhất.');
        await loadCadastralInfo();
        return;
      }

      Alert.alert(
        'Có bản cập nhật mới',
        `Phiên bản: ${updateAvailable.version}\n` +
          `Ngày phát hành: ${new Date(updateAvailable.releaseDate).toLocaleDateString('vi-VN')}\n` +
          `Số thay đổi: ${updateAvailable.changeCount}\n\n` +
          `${updateAvailable.description}\n\n` +
          `Bạn có muốn cập nhật ngay?`,
        [
          { text: 'Để sau', style: 'cancel' },
          {
            text: 'Cập nhật',
            onPress: async () => {
              try {
                const result = await cadastralUpdate.applyUpdate(updateAvailable);

                if (result.success) {
                  Alert.alert(
                    'Thành công',
                    `${result.message}\n\n` +
                      `Phiên bản cũ: ${result.previousVersion}\n` +
                      `Phiên bản mới: ${result.newVersion}`
                  );
                  await loadCadastralInfo();
                } else {
                  Alert.alert('Lỗi', result.message + (result.errors ? '\n\n' + result.errors.join('\n') : ''));
                }
              } catch (error) {
                Alert.alert('Lỗi', 'Không thể áp dụng bản cập nhật. Vui lòng thử lại.');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể kiểm tra cập nhật. Vui lòng thử lại.');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      Alert.alert('Không có kết nối', 'Vui lòng kiểm tra kết nối mạng và thử lại.');
      return;
    }

    if (pendingCount === 0) {
      Alert.alert('Thông báo', 'Không có dữ liệu cần đồng bộ.');
      return;
    }

    setIsSyncing(true);
    try {
      await sync();
      Alert.alert('Thành công', 'Đã đồng bộ dữ liệu thành công.');
    } catch (error) {
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi đồng bộ dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin người dùng.');
      return;
    }

    Alert.alert(
      'Xuất dữ liệu',
      'Tạo file sao lưu chứa tất cả dữ liệu khảo sát (đã đồng bộ, chờ đồng bộ, và bản nháp)?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xuất dữ liệu',
          onPress: async () => {
            setIsExporting(true);
            try {
              const filePath = await dataExportService.exportAllData(user.id);

              Alert.alert(
                'Thành công',
                'Đã tạo file sao lưu thành công. Bạn có muốn chia sẻ file này?',
                [
                  { text: 'Để sau', style: 'cancel' },
                  {
                    text: 'Chia sẻ',
                    onPress: async () => {
                      try {
                        await dataExportService.shareExportFile(filePath);
                      } catch (shareError) {
                        Alert.alert('Lỗi', 'Không thể chia sẻ file. Vui lòng thử lại.');
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xuất dữ liệu. Vui lòng thử lại.');
            } finally {
              setIsExporting(false);
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất? Dữ liệu chưa đồng bộ sẽ được giữ lại trên thiết bị.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đăng xuất',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const formatLastSyncTime = (timestamp: string | undefined) => {
    if (!timestamp) return 'Chưa đồng bộ lần nào';

    const now = Date.now();
    const syncTime = new Date(timestamp).getTime();
    const diff = now - syncTime;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    return `${days} ngày trước`;
  };

  return (
    <SafeScreen>
      <Header
        title="Cài đặt"
        rightAction={
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Feather name="x" size={24} color={theme.colors.special.white} />
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.container}>
        {/* Officer Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cán bộ</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Mã cán bộ:</Text>
              <Text style={styles.value}>{user?.idNumber || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Họ và tên:</Text>
              <Text style={styles.value}>{user?.fullName || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Số điện thoại:</Text>
              <Text style={styles.value}>{user?.phoneNumber || 'N/A'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Đơn vị:</Text>
              <Text style={styles.value}>{user?.unitCode || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Sync Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trạng thái đồng bộ</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Kết nối:</Text>
              <View
                style={[
                  styles.statusBadge,
                  isOnline ? styles.onlineBadge : styles.offlineBadge,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    isOnline ? styles.onlineText : styles.offlineText,
                  ]}
                >
                  {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Đồng bộ lần cuối:</Text>
              <Text style={styles.value}>{formatLastSyncTime(lastSyncTime)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Chờ đồng bộ:</Text>
              <Text style={[styles.value, pendingCount > 0 && styles.pendingText]}>
                {pendingCount} khảo sát
              </Text>
            </View>
            {failedCount > 0 && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Lỗi đồng bộ:</Text>
                  <Text style={[styles.value, styles.errorText]}>
                    {failedCount} khảo sát
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Sync Now Button */}
          <TouchableOpacity
            style={[
              styles.syncButton,
              (!isOnline || pendingCount === 0 || isSyncing) && styles.syncButtonDisabled,
            ]}
            onPress={handleSyncNow}
            disabled={!isOnline || pendingCount === 0 || isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.syncButtonText}>Đồng bộ ngay</Text>
            )}
          </TouchableOpacity>

          {!isOnline && (
            <Text style={styles.syncHint}>
              Cần kết nối mạng để đồng bộ dữ liệu
            </Text>
          )}
          {isOnline && pendingCount === 0 && (
            <Text style={styles.syncHint}>Không có dữ liệu cần đồng bộ</Text>
          )}
        </View>

        {/* Cadastral Data Updates Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục địa chính</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phiên bản hiện tại:</Text>
              <Text style={styles.value}>{cadastralVersion || 'Chưa xác định'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Kiểm tra lần cuối:</Text>
              <Text style={styles.value}>
                {lastUpdateCheck
                  ? new Date(lastUpdateCheck).toLocaleDateString('vi-VN')
                  : 'Chưa kiểm tra'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Cập nhật danh mục</Text>
                <Text style={styles.helpText}>
                  Kiểm tra và tải về phiên bản mới nhất của danh mục loại đất, mục đích sử dụng
                  đất từ Bộ Tài nguyên và Môi trường.
                </Text>
              </View>
            </View>
          </View>

          {/* Check Updates Button */}
          <TouchableOpacity
            style={[
              styles.updateButton,
              (!isOnline || isCheckingUpdates) && styles.updateButtonDisabled,
            ]}
            onPress={handleCheckCadastralUpdates}
            disabled={!isOnline || isCheckingUpdates}
          >
            {isCheckingUpdates ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="refresh-cw" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.updateButtonText}>Kiểm tra cập nhật</Text>
              </>
            )}
          </TouchableOpacity>

          {!isOnline && (
            <Text style={styles.syncHint}>Cần kết nối mạng để kiểm tra cập nhật</Text>
          )}
        </View>

        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quản lý dữ liệu</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Sao lưu dữ liệu</Text>
                <Text style={styles.helpText}>
                  Xuất tất cả dữ liệu khảo sát (đã đồng bộ, chờ đồng bộ, và bản nháp) ra file JSON
                  để sao lưu hoặc kiểm toán.
                </Text>
              </View>
            </View>
          </View>

          {/* Export Button */}
          <TouchableOpacity
            style={[styles.exportButton, isExporting && styles.exportButtonDisabled]}
            onPress={handleExportData}
            disabled={isExporting}
          >
            {isExporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="download" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.exportButtonText}>Xuất dữ liệu</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* App Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Tên ứng dụng:</Text>
              <Text style={styles.value}>LocationID Tracker</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Phiên bản:</Text>
              <Text style={styles.value}>1.0.0 (C06)</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.label}>Mục đích:</Text>
              <Text style={styles.value}>Khảo sát địa bàn xã</Text>
            </View>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Đăng xuất</Text>
        </TouchableOpacity>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.neutral[50],
  },
  section: {
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.neutral[600],
    textTransform: 'uppercase',
    marginBottom: theme.spacing.md,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    color: theme.colors.neutral[600],
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: theme.colors.primary[700],
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.neutral[200],
    marginVertical: theme.spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
  onlineBadge: {
    backgroundColor: theme.colors.success[100],
  },
  offlineBadge: {
    backgroundColor: theme.colors.neutral[200],
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  onlineText: {
    color: theme.colors.success[700],
  },
  offlineText: {
    color: theme.colors.neutral[600],
  },
  pendingText: {
    color: theme.colors.warning[600],
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.error[600],
    fontWeight: '600',
  },
  syncButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  syncButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  syncButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  syncHint: {
    fontSize: 12,
    color: theme.colors.neutral[500],
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  helpText: {
    fontSize: 12,
    color: theme.colors.neutral[500],
    marginTop: theme.spacing.xs,
    lineHeight: 18,
  },
  exportButton: {
    backgroundColor: theme.colors.warning[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  exportButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: theme.colors.primary[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    ...theme.shadows.sm,
  },
  updateButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: theme.colors.error[600],
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
});
