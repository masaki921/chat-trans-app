import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMessages } from '../../../src/hooks/useMessages';
import { useAuth } from '../../../src/hooks/useAuth';
import { useConversations } from '../../../src/hooks/useConversations';
import { MessageBubble } from '../../../src/components/chat/MessageBubble';
import { ChatInputBar } from '../../../src/components/chat/ChatInputBar';
import { Avatar } from '../../../src/components/shared/Avatar';
import { ImageViewerModal } from '../../../src/components/chat/ImageViewerModal';
import { pickImage } from '../../../src/utils/imageUpload';
import { setActiveConversation } from '../../../src/hooks/useNotifications';
import { colors, typography, spacing } from '../../../src/theme';

export default function ChatRoomScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { messages, sendMessage, sendImage } = useMessages(conversationId ?? '');
  const { conversations } = useConversations();
  const flatListRef = useRef<FlatList>(null);

  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const userLanguage = profile?.primary_language ?? 'en';

  // 相手の情報を取得
  const partner = useMemo(() => {
    const convo = conversations.find((c) => c.id === conversationId);
    if (!convo) return null;
    const otherMember = convo.members.find((m) => m.user_id !== user?.id);
    return otherMember?.profile ?? null;
  }, [conversations, conversationId, user?.id]);

  // 閲覧中の会話を設定（通知抑制用）
  useEffect(() => {
    setActiveConversation(conversationId ?? null);
    return () => setActiveConversation(null);
  }, [conversationId]);

  // 新着メッセージ時に自動スクロール
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // 画像添付ハンドラー
  const handleAttach = useCallback(() => {
    const options = ['カメラで撮影', 'ライブラリから選択', 'キャンセル'];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        async (buttonIndex) => {
          let source: 'camera' | 'gallery' | null = null;
          if (buttonIndex === 0) source = 'camera';
          if (buttonIndex === 1) source = 'gallery';
          if (!source) return;

          const uri = await pickImage(source, {
            allowsEditing: false,
            quality: 0.7,
          });
          if (uri) sendImage(uri);
        }
      );
    } else {
      Alert.alert('画像を送信', '', [
        {
          text: 'カメラで撮影',
          onPress: async () => {
            const uri = await pickImage('camera', { allowsEditing: false, quality: 0.7 });
            if (uri) sendImage(uri);
          },
        },
        {
          text: 'ライブラリから選択',
          onPress: async () => {
            const uri = await pickImage('gallery', { allowsEditing: false, quality: 0.7 });
            if (uri) sendImage(uri);
          },
        },
        { text: 'キャンセル', style: 'cancel' },
      ]);
    }
  }, [sendImage]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Avatar
            uri={partner?.avatar_url}
            name={partner?.display_name ?? ''}
            size={32}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {partner?.display_name ?? 'Chat'}
            </Text>
          </View>
          <Pressable style={styles.menuButton}>
            <Ionicons
              name="ellipsis-horizontal"
              size={24}
              color={colors.subText}
            />
          </Pressable>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === user?.id}
              userLanguage={userLanguage}
              onImagePress={setViewerImage}
            />
          )}
          contentContainerStyle={styles.messagesList}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Text style={styles.emptyMessagesText}>
                メッセージはまだありません
              </Text>
            </View>
          }
        />

        {/* Input */}
        <ChatInputBar onSend={sendMessage} onAttach={handleAttach} />
      </KeyboardAvoidingView>

      {/* Image Viewer */}
      <ImageViewerModal
        uri={viewerImage}
        visible={!!viewerImage}
        onClose={() => setViewerImage(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  backButton: {
    padding: spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  menuButton: {
    padding: spacing.sm,
  },
  messagesList: {
    paddingVertical: spacing.sm,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyMessagesText: {
    ...typography.sub,
    color: colors.subText,
  },
});
