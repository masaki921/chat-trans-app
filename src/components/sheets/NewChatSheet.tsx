import { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../shared/Avatar';
import { useFriendships } from '../../hooks/useFriendships';
import { colors, typography, spacing } from '../../theme';

type Props = {
  onStartChat: (conversationId: string) => void;
  onOpenAddFriend: () => void;
};

export type NewChatSheetRef = {
  open: () => void;
  close: () => void;
};

export const NewChatSheet = forwardRef<NewChatSheetRef, Props>(
  ({ onStartChat, onOpenAddFriend }, ref) => {
    const [visible, setVisible] = useState(false);
    const { friends, pendingRequests, startConversation } = useFriendships();

    useImperativeHandle(ref, () => ({
      open: () => setVisible(true),
      close: () => setVisible(false),
    }));

    const handleFriendPress = useCallback(
      async (friendId: string) => {
        const conversationId = await startConversation(friendId);
        if (conversationId) {
          setVisible(false);
          onStartChat(conversationId);
        }
      },
      [startConversation, onStartChat]
    );

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            {/* ハンドル */}
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>新しいチャット</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={colors.subText} />
              </Pressable>
            </View>

            {/* 友達追加ボタン */}
            <Pressable
              style={styles.addFriendRow}
              onPress={() => {
                setVisible(false);
                setTimeout(onOpenAddFriend, 300);
              }}
            >
              <View style={styles.addFriendIcon}>
                <Ionicons name="person-add" size={20} color={colors.primary} />
              </View>
              <Text style={styles.addFriendText}>IDで友達追加</Text>
            </Pressable>

            {/* 保留中リクエストバナー */}
            {pendingRequests.length > 0 && (
              <View style={styles.pendingBanner}>
                <Ionicons name="mail" size={18} color={colors.accent} />
                <Text style={styles.pendingText}>
                  フレンドリクエストが{pendingRequests.length}件あります
                </Text>
              </View>
            )}

            {/* フレンド一覧 */}
            <FlatList
              data={friends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.friendItem}
                  onPress={() => handleFriendPress(item.friend.id)}
                >
                  <Avatar
                    uri={item.friend.avatar_url}
                    name={item.friend.display_name}
                    size={40}
                  />
                  <Text style={styles.friendName}>
                    {item.friend.display_name}
                  </Text>
                </Pressable>
              )}
              ListEmptyComponent={
                <View style={styles.emptyFriends}>
                  <Text style={styles.emptyText}>まだ友達がいません</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  }
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.subText,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  addFriendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: spacing.md,
  },
  addFriendIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFriendText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.primary,
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    marginHorizontal: spacing.md,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  pendingText: {
    fontSize: 14,
    color: colors.accent,
    fontWeight: '500',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: spacing.md,
  },
  friendName: {
    fontSize: 16,
    color: colors.text,
  },
  emptyFriends: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...typography.sub,
    color: colors.subText,
  },
});
