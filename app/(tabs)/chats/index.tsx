import { useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useConversations } from '../../../src/hooks/useConversations';
import { useAuth } from '../../../src/hooks/useAuth';
import { ConversationItem } from '../../../src/components/chat/ConversationItem';
import { NewChatSheet, NewChatSheetRef } from '../../../src/components/sheets/NewChatSheet';
import { AddFriendSheet, AddFriendSheetRef } from '../../../src/components/sheets/AddFriendSheet';
import { colors, typography, spacing } from '../../../src/theme';

export default function ChatListScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { conversations, refetch } = useConversations();
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
        <Text style={styles.headerTitle}>Chats</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => newChatRef.current?.open()}
        >
          <Ionicons name="add" size={28} color={colors.primary} />
        </Pressable>
      </View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="chatbubbles-outline"
              size={48}
              color={colors.subText}
            />
          </View>
          <Text style={styles.emptyTitle}>会話を始めましょう</Text>
          <Text style={styles.emptyMessage}>
            友達を追加して{'\n'}最初のメッセージを送りましょう
          </Text>
          <Pressable
            style={styles.emptyButton}
            onPress={() => addFriendRef.current?.open()}
          >
            <Text style={styles.emptyButtonText}>友達を追加する</Text>
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
