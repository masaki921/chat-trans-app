import { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConversations } from '../../../src/hooks/useConversations';
import { useAuth } from '../../../src/hooks/useAuth';
import { ConversationItem } from '../../../src/components/chat/ConversationItem';
import { NewChatSheet, NewChatSheetRef } from '../../../src/components/sheets/NewChatSheet';
import { AddFriendSheet, AddFriendSheetRef } from '../../../src/components/sheets/AddFriendSheet';
import { colors, typography, spacing } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { conversations, isLoading, refetch } = useConversations();
  const { t } = useI18n();
  const newChatRef = useRef<NewChatSheetRef>(null);
  const addFriendRef = useRef<AddFriendSheetRef>(null);

  const handleStartChat = useCallback(
    (conversationId: string) => {
      router.push(`/(tabs)/chats/${conversationId}`);
    },
    [router]
  );

  const handleOpenAddFriend = useCallback(() => {
    addFriendRef.current?.open();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t.chats_title}</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => newChatRef.current?.open()}
        >
          <Ionicons name="add" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={colors.subText}
            />
          </View>
          <Text style={styles.emptyTitle}>{t.chats_empty_title}</Text>
          <Text style={styles.emptyMessage}>{t.chats_empty_message}</Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => addFriendRef.current?.open()}
          >
            <Text style={styles.emptyButtonText}>{t.chats_empty_button}</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              currentUserId={user?.id ?? ''}
              onPress={() => router.push(`/(tabs)/chats/${item.id}`)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          onRefresh={refetch}
          refreshing={false}
        />
      )}

      <NewChatSheet
        ref={newChatRef}
        onStartChat={handleStartChat}
        onOpenAddFriend={handleOpenAddFriend}
      />
      <AddFriendSheet ref={addFriendRef} />
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    ...typography.heading,
    fontSize: 28,
    color: colors.text,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: {
    height: 0.5,
    backgroundColor: colors.divider,
    marginLeft: 82,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyMessage: {
    ...typography.sub,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
});
