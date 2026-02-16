import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Avatar } from '../shared/Avatar';
import { ConversationWithDetails } from '../../types/chat';
import { colors, typography, spacing } from '../../theme';
import { formatConversationTime } from '../../utils/formatDate';

type Props = {
  conversation: ConversationWithDetails;
  currentUserId: string;
  onPress: () => void;
};

export function ConversationItem({ conversation, currentUserId, onPress }: Props) {
  // 相手のメンバーを取得（direct chatの場合）
  const otherMember = conversation.members.find(
    (m) => m.user_id !== currentUserId
  );
  const myMember = conversation.members.find(
    (m) => m.user_id === currentUserId
  );

  const displayName =
    conversation.type === 'direct'
      ? otherMember?.profile?.display_name ?? '不明なユーザー'
      : conversation.name ?? 'グループ';

  const avatarUrl =
    conversation.type === 'direct'
      ? otherMember?.profile?.avatar_url
      : conversation.avatar_url;

  const unreadCount = myMember?.unread_count ?? 0;
  const timeText = conversation.last_message_at
    ? formatConversationTime(conversation.last_message_at)
    : '';

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <Avatar
        uri={avatarUrl}
        name={displayName}
        size={50}
        showOnline
        isOnline={otherMember?.profile?.is_online}
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.time}>{timeText}</Text>
        </View>
        <View style={styles.bottomRow}>
          <Text style={styles.preview} numberOfLines={1}>
            {conversation.last_message_preview ?? ''}
          </Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.sub,
    color: colors.subText,
    fontSize: 12,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  preview: {
    ...typography.sub,
    color: colors.subText,
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
