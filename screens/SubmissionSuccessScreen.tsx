/**
 * SubmissionSuccessScreen - Success confirmation after survey submission
 * Shows confirmation message based on online/offline status with next actions
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
  H2,
  H3,
  Badge,
} from '../components';
import { theme } from '../theme';
import { useSyncStore } from '../store/syncStore';

type SubmissionSuccessScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SubmissionSuccess'
>;
type SubmissionSuccessScreenRouteProp = RouteProp<
  RootStackParamList,
  'SubmissionSuccess'
>;

interface Props {
  navigation: SubmissionSuccessScreenNavigationProp;
  route: SubmissionSuccessScreenRouteProp;
}

export const SubmissionSuccessScreen: React.FC<Props> = ({
  navigation,
  route,
}) => {
  const { wasOnline } = route.params;
  const { isOnline, queue } = useSyncStore();
  const queuedCount = queue.length;

  const handleBackToDashboard = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
  };

  const handleStartNewSurvey = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Dashboard' }],
    });
    // Navigate to start survey after a brief moment
    setTimeout(() => {
      navigation.navigate('StartSurvey');
    }, 100);
  };

  return (
    <SafeScreen>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
      >
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.successIcon}>
            <Feather
              name="check-circle"
              size={80}
              color={theme.colors.success[500]}
            />
          </View>
        </View>

        {/* Success Message */}
        <H2 style={styles.title}>
          {wasOnline ? 'Gửi thành công!' : 'Đã lưu khảo sát!'}
        </H2>

        {/* Status Badge */}
        <View style={styles.statusContainer}>
          <Badge variant={isOnline ? 'success' : 'warning'} size="large">
            {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
          </Badge>
        </View>

        {/* Information Card */}
        <Card style={styles.card}>
          {wasOnline ? (
            <>
              <View style={styles.infoRow}>
                <Feather
                  name="check"
                  size={20}
                  color={theme.colors.success[500]}
                  style={styles.infoIcon}
                />
                <Body>Khảo sát đã được gửi và lưu trữ thành công.</Body>
              </View>
              <View style={styles.infoRow}>
                <Feather
                  name="database"
                  size={20}
                  color={theme.colors.success[500]}
                  style={styles.infoIcon}
                />
                <Body>Dữ liệu đã được đồng bộ lên hệ thống.</Body>
              </View>
              <View style={styles.infoRow}>
                <Feather
                  name="image"
                  size={20}
                  color={theme.colors.success[500]}
                  style={styles.infoIcon}
                />
                <Body>Hình ảnh đã được tải lên.</Body>
              </View>
            </>
          ) : (
            <>
              <View style={styles.infoRow}>
                <Feather
                  name="save"
                  size={20}
                  color={theme.colors.warning[500]}
                  style={styles.infoIcon}
                />
                <Body>
                  Khảo sát đã được lưu vào bộ nhớ thiết bị.
                </Body>
              </View>
              <View style={styles.infoRow}>
                <Feather
                  name="wifi-off"
                  size={20}
                  color={theme.colors.warning[500]}
                  style={styles.infoIcon}
                />
                <Body>
                  Bạn đang ở chế độ ngoại tuyến.
                </Body>
              </View>
              <View style={styles.infoRow}>
                <Feather
                  name="refresh-cw"
                  size={20}
                  color={theme.colors.warning[500]}
                  style={styles.infoIcon}
                />
                <Body>
                  Khảo sát sẽ tự động đồng bộ khi có kết nối mạng.
                </Body>
              </View>
            </>
          )}
        </Card>

        {/* Queued Surveys Info (if any) */}
        {!wasOnline && queuedCount > 0 && (
          <Card style={styles.queueCard}>
            <H3 style={styles.queueTitle}>📋 Hàng đợi đồng bộ</H3>
            <Body style={styles.queueText}>
              Hiện có <Body style={styles.bold}>{queuedCount}</Body> khảo sát chờ đồng bộ.
            </Body>
            <BodySmall color="neutral" style={styles.queueHint}>
              Các khảo sát sẽ được tự động gửi lên hệ thống khi thiết bị kết nối mạng.
            </BodySmall>
          </Card>
        )}

        {/* Next Steps */}
        <Card style={styles.card}>
          <H3 style={styles.nextStepsTitle}>Bước tiếp theo</H3>
          <BodySmall color="neutral">
            Bạn có thể quay về Dashboard để xem danh sách khảo sát hoặc bắt đầu
            một khảo sát mới.
          </BodySmall>
        </Card>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <Button
          variant="outline"
          onPress={handleBackToDashboard}
          style={styles.buttonDashboard}
        >
          Về Dashboard
        </Button>
        <Button
          variant="primary"
          onPress={handleStartNewSurvey}
          style={styles.buttonNewSurvey}
        >
          Khảo sát mới
        </Button>
      </View>
    </SafeScreen>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.base,
    paddingBottom: theme.spacing.xl * 3,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  successIcon: {
    padding: theme.spacing.base,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.spacing.base,
    color: theme.colors.primary[600],
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  card: {
    marginBottom: theme.spacing.base,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.base,
  },
  infoIcon: {
    marginRight: theme.spacing.base,
    marginTop: 2,
  },
  queueCard: {
    backgroundColor: '#fffbeb',
    borderColor: theme.colors.warning[500],
    borderWidth: 1,
  },
  queueTitle: {
    marginBottom: theme.spacing.sm,
  },
  queueText: {
    marginBottom: theme.spacing.sm,
  },
  bold: {
    fontWeight: '600',
  },
  queueHint: {
    fontStyle: 'italic',
  },
  nextStepsTitle: {
    marginBottom: theme.spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.base,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    ...theme.shadows.card,
  },
  buttonDashboard: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  buttonNewSurvey: {
    flex: 1.5,
  },
});
