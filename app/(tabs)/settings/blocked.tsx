import { View, Text, StyleSheet, Pressable, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFriendships } from '../../../src/hooks/useFriendships';
import { Avatar } from '../../../src/components/shared/Avatar';
import { colors, typography, spacing } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';

export default function BlockedUsersScreen() {
  const router = useRouter();
  const { blockedUsers, unblockUser } = useFriendships();
  const { t } = useI18n();

  const handleUnblock = (friendshipId: string) => {
    Alert.alert(t.unblock_user, '', [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.unblock_user,
        onPress: async () => {
          const { error } = await unblockUser(friendshipId);
          if (error) Alert.alert(t.error, error.message);
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.settings_blockedUsers}</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar
              uri={item.friend.avatar_url}
              name={item.friend.display_name}
              size={44}
            />
            <View style={styles.rowInfo}>
              <Text style={styles.rowName}>{item.friend.display_name}</Text>
            </View>
            <Pressable style={styles.unblockButton} onPress={() => handleUnblock(item.id)}>
              <Text style={styles.unblockText}>{t.unblock_user}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="remove-circle-outline" size={48} color={colors.subText} />
            <Text style={styles.emptyTitle}>{t.blocked_empty}</Text>
          </View>
        }
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
  unblockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: 100,
  },
  emptyTitle: {
    ...typography.sub,
    color: colors.subText,
  },
});
