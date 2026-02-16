import { View, Text, StyleSheet, Pressable, SectionList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFriendships } from '../../../src/hooks/useFriendships';
import { Avatar } from '../../../src/components/shared/Avatar';
import { colors, typography, spacing } from '../../../src/theme';

export default function FriendManageScreen() {
  const router = useRouter();
  const { friends, pendingRequests, acceptRequest, rejectRequest } = useFriendships();

  const handleAccept = async (friendshipId: string) => {
    const { error } = await acceptRequest(friendshipId);
    if (error) Alert.alert('エラー', error.message);
  };

  const handleReject = async (friendshipId: string) => {
    Alert.alert('リクエストを拒否', '本当に拒否しますか？', [
      { text: 'キャンセル', style: 'cancel' },
      {
        text: '拒否',
        style: 'destructive',
        onPress: async () => {
          const { error } = await rejectRequest(friendshipId);
          if (error) Alert.alert('エラー', error.message);
        },
      },
    ]);
  };

  const sections = [
    ...(pendingRequests.length > 0
      ? [{ title: `フレンドリクエスト（${pendingRequests.length}件）`, data: pendingRequests, type: 'pending' as const }]
      : []),
    ...(friends.length > 0
      ? [{ title: `友達一覧（${friends.length}人）`, data: friends, type: 'friend' as const }]
      : []),
  ];

  const isEmpty = pendingRequests.length === 0 && friends.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>友達管理</Text>
        <View style={{ width: 24 }} />
      </View>

      {isEmpty ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.subText} />
          <Text style={styles.emptyTitle}>フレンドリクエストはありません</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{section.title}</Text>
          )}
          renderItem={({ item, section }) => (
            <View style={styles.row}>
              <Avatar
                uri={item.friend.avatar_url}
                name={item.friend.display_name}
                size={44}
              />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.friend.display_name}</Text>
                {section.type === 'pending' && (
                  <Text style={styles.rowSub}>リクエストを受信</Text>
                )}
              </View>
              {section.type === 'pending' && (
                <View style={styles.actions}>
                  <Pressable
                    style={styles.acceptButton}
                    onPress={() => handleAccept(item.id)}
                  >
                    <Text style={styles.acceptText}>承認</Text>
                  </Pressable>
                  <Pressable
                    style={styles.rejectButton}
                    onPress={() => handleReject(item.id)}
                  >
                    <Ionicons name="close" size={18} color={colors.subText} />
                  </Pressable>
                </View>
              )}
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.subText,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  rowInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  rowSub: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyTitle: {
    ...typography.sub,
    color: colors.subText,
  },
});
