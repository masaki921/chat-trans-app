import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFriendships } from '../../../src/hooks/useFriendships';
import { Avatar } from '../../../src/components/shared/Avatar';
import { UserProfileModal } from '../../../src/components/shared/UserProfileModal';
import { colors, typography, spacing } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import type { Profile } from '../../../src/types/database';

export default function FriendManageScreen() {
  const router = useRouter();
  const { friends, startConversation } = useFriendships();
  const { t } = useI18n();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const handlePressFriend = useCallback(
    async (friendId: string) => {
      const conversationId = await startConversation(friendId);
      if (conversationId) {
        router.push(`/(tabs)/chats/${conversationId}`);
      } else {
        Alert.alert(t.error ?? 'Error', t.chat_startFailed ?? 'チャットを開始できませんでした');
      }
    },
    [startConversation, router, t]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.friends_title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {friends.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color={colors.subText} />
          <Text style={styles.emptyTitle}>{t.newChat_noFriends}</Text>
        </View>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              {t.friends_friendCount.replace('{count}', String(friends.length))}
            </Text>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => handlePressFriend(item.friend.id)}
            >
              <Avatar
                uri={item.friend.avatar_url}
                name={item.friend.display_name}
                size={44}
                onPress={() => setSelectedProfile(item.friend as Profile)}
              />
              <View style={styles.rowInfo}>
                <Text style={styles.rowName}>{item.friend.display_name}</Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <UserProfileModal
        profile={selectedProfile}
        visible={!!selectedProfile}
        onClose={() => setSelectedProfile(null)}
      />
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
