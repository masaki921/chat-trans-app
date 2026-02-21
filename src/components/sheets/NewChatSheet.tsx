import { forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../shared/Avatar';
import { colors, typography, spacing } from '../../theme';
import { useI18n } from '../../i18n';
import type { Profile, Friendship } from '../../types/database';

type FriendWithProfile = Friendship & { friend: Profile };

type Props = {
  onStartChat: (conversationId: string) => void;
  onOpenAddFriend: () => void;
  friends: FriendWithProfile[];
  pendingRequests: FriendWithProfile[];
  acceptRequest: (id: string) => Promise<{ error: Error | null }>;
  rejectRequest: (id: string) => Promise<{ error: Error | null }>;
  startConversation: (friendId: string) => Promise<string | null>;
  refetch: () => void;
};

export type NewChatSheetRef = {
  open: () => void;
  close: () => void;
};

export const NewChatSheet = forwardRef<NewChatSheetRef, Props>(
  ({ onStartChat, onOpenAddFriend, friends, pendingRequests, acceptRequest, rejectRequest, startConversation, refetch }, ref) => {
    const [visible, setVisible] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { t } = useI18n();

    useImperativeHandle(ref, () => ({
      open: () => {
        refetch();
        setVisible(true);
      },
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

    const handleAcceptAndChat = useCallback(
      async (friendshipId: string, friendId: string) => {
        setProcessingId(friendshipId);
        const { error } = await acceptRequest(friendshipId);
        if (!error) {
          const conversationId = await startConversation(friendId);
          if (conversationId) {
            setVisible(false);
            setProcessingId(null);
            onStartChat(conversationId);
            return;
          }
        }
        setProcessingId(null);
      },
      [acceptRequest, startConversation, onStartChat]
    );

    const handleReject = useCallback(
      async (friendshipId: string) => {
        setProcessingId(friendshipId);
        await rejectRequest(friendshipId);
        setProcessingId(null);
      },
      [rejectRequest]
    );

    const listData = [
      ...pendingRequests.map((p) => ({ ...p, _type: 'pending' as const })),
      ...friends.map((f) => ({ ...f, _type: 'friend' as const })),
    ];

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.handleArea}>
              <View style={styles.handle} />
            </View>

            <View style={styles.header}>
              <Text style={styles.title}>{t.newChat_title}</Text>
              <Pressable onPress={() => setVisible(false)}>
                <Ionicons name="close" size={24} color={colors.subText} />
              </Pressable>
            </View>

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
              <Text style={styles.addFriendText}>{t.newChat_addFriend}</Text>
            </Pressable>

            <FlatList
              data={listData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                if (item._type === 'pending') {
                  const isProcessing = processingId === item.id;
                  return (
                    <View style={styles.pendingItem}>
                      <Avatar
                        uri={item.friend.avatar_url}
                        name={item.friend.display_name}
                        size={40}
                      />
                      <View style={styles.pendingInfo}>
                        <Text style={styles.friendName}>
                          {item.friend.display_name}
                        </Text>
                        <Text style={styles.pendingLabel}>{t.friends_received}</Text>
                      </View>
                      {isProcessing ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <View style={styles.pendingActions}>
                          <Pressable
                            style={styles.acceptButton}
                            onPress={() => handleAcceptAndChat(item.id, item.friend.id)}
                          >
                            <Text style={styles.acceptText}>{t.friends_accept}</Text>
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
                  );
                }

                return (
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
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyFriends}>
                  <Text style={styles.emptyText}>{t.newChat_noFriends}</Text>
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
  pendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    gap: spacing.md,
    backgroundColor: '#FFF7F2',
    marginHorizontal: spacing.sm,
    marginBottom: 4,
    borderRadius: 10,
  },
  pendingInfo: {
    flex: 1,
  },
  pendingLabel: {
    fontSize: 12,
    color: colors.accent,
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  acceptButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  rejectButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
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
