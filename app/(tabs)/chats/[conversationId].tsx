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
import { useFriendships } from '../../../src/hooks/useFriendships';
import { useConversations } from '../../../src/hooks/useConversations';
import { supabase } from '../../../src/services/supabase';
import { Profile } from '../../../src/types/database';
import { MessageBubble } from '../../../src/components/chat/MessageBubble';
import { ChatInputBar } from '../../../src/components/chat/ChatInputBar';
import { Avatar } from '../../../src/components/shared/Avatar';
import { ImageViewerModal } from '../../../src/components/chat/ImageViewerModal';
import { ImagePickerSheet } from '../../../src/components/chat/ImagePickerSheet';
import { UserProfileModal } from '../../../src/components/shared/UserProfileModal';
import { pickImage } from '../../../src/utils/imageUpload';
import * as Notifications from 'expo-notifications';
import { setActiveConversation } from '../../../src/hooks/useNotifications';
import { colors, typography, spacing } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';

export default function ChatRoomScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const { messages, sendMessage, sendImage, deleteMessage } = useMessages(conversationId ?? '');
  const { blockUser, reportUser } = useFriendships();
  const { deleteConversation } = useConversations();
  const flatListRef = useRef<FlatList>(null);

  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [profileVisible, setProfileVisible] = useState(false);

  const userLanguage = profile?.translation_language ?? profile?.primary_language ?? 'en';

  // 相手のプロフィールをDBから直接取得
  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchPartner = async () => {
      const { data: members } = await supabase
        .from('conversation_members')
        .select('user_id, profile:profiles(*)')
        .eq('conversation_id', conversationId);

      const other = members?.find((m: any) => m.user_id !== user.id);
      setPartner((other?.profile as unknown as Profile) ?? null);
    };

    fetchPartner();
  }, [conversationId, user?.id]);

  useEffect(() => {
    setActiveConversation(conversationId ?? null);
    // ロック画面に残っている通知もdismiss
    Notifications.dismissAllNotificationsAsync();
    return () => setActiveConversation(null);
  }, [conversationId]);

  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  const handleAttach = useCallback(() => {
    const options = [t.chat_camera, t.chat_gallery, t.cancel];
    const cancelButtonIndex = 2;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            // カメラ → 撮影して即送信
            const uri = await pickImage('camera', { allowsEditing: false, quality: 0.7 });
            if (uri) sendImage(uri);
          } else if (buttonIndex === 1) {
            // ギャラリー → グリッドピッカーを開く
            setPickerVisible(true);
          }
        }
      );
    } else {
      Alert.alert(t.chat_sendImage, '', [
        {
          text: t.chat_camera,
          onPress: async () => {
            const uri = await pickImage('camera', { allowsEditing: false, quality: 0.7 });
            if (uri) sendImage(uri);
          },
        },
        {
          text: t.chat_gallery,
          onPress: () => setPickerVisible(true),
        },
        { text: t.cancel, style: 'cancel' },
      ]);
    }
  }, [sendImage, t]);

  const handleHeaderMenu = useCallback(() => {
    if (!partner) return;

    const options = [t.block_user, t.report_user, t.chat_delete, t.cancel];
    const destructiveButtonIndex = 0;
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex, cancelButtonIndex },
        (buttonIndex) => {
          if (buttonIndex === 0) handleBlockUser();
          if (buttonIndex === 1) handleReportUser();
          if (buttonIndex === 2) handleDeleteChat();
        }
      );
    } else {
      Alert.alert('', '', [
        { text: t.block_user, style: 'destructive', onPress: handleBlockUser },
        { text: t.report_user, onPress: handleReportUser },
        { text: t.chat_delete, onPress: handleDeleteChat },
        { text: t.cancel, style: 'cancel' },
      ]);
    }
  }, [partner, t]);

  const handleBlockUser = useCallback(() => {
    if (!partner) return;
    Alert.alert(t.block_user, t.block_confirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.block_user,
        style: 'destructive',
        onPress: async () => {
          await blockUser(partner.id);
          router.back();
        },
      },
    ]);
  }, [partner, blockUser, router, t]);

  const handleDeleteChat = useCallback(() => {
    if (!conversationId) return;
    Alert.alert(t.chat_delete, t.chat_deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.chat_delete,
        style: 'destructive',
        onPress: async () => {
          await deleteConversation(conversationId);
          router.back();
        },
      },
    ]);
  }, [conversationId, deleteConversation, router, t]);

  const handleReportUser = useCallback(() => {
    if (!partner) return;
    const reasons = [
      t.report_reason_spam,
      t.report_reason_harassment,
      t.report_reason_inappropriate,
      t.report_reason_other,
      t.cancel,
    ];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { title: t.report_selectReason, options: reasons, cancelButtonIndex: 4 },
        async (buttonIndex) => {
          if (buttonIndex < 4) {
            await reportUser(partner.id, reasons[buttonIndex]);
            Alert.alert('', t.report_success);
          }
        }
      );
    } else {
      Alert.alert(t.report_selectReason, '', [
        ...reasons.slice(0, 4).map((reason) => ({
          text: reason,
          onPress: async () => {
            await reportUser(partner.id, reason);
            Alert.alert('', t.report_success);
          },
        })),
        { text: t.cancel, style: 'cancel' as const },
      ]);
    }
  }, [partner, reportUser, t]);

  const handleReportMessage = useCallback(
    (messageId: string) => {
      if (!partner) return;
      const reasons = [
        t.report_reason_spam,
        t.report_reason_harassment,
        t.report_reason_inappropriate,
        t.report_reason_other,
        t.cancel,
      ];

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { title: t.report_selectReason, options: reasons, cancelButtonIndex: 4 },
          async (buttonIndex) => {
            if (buttonIndex < 4) {
              await reportUser(partner.id, reasons[buttonIndex], messageId);
              Alert.alert('', t.report_success);
            }
          }
        );
      } else {
        Alert.alert(t.report_selectReason, '', [
          ...reasons.slice(0, 4).map((reason) => ({
            text: reason,
            onPress: async () => {
              await reportUser(partner.id, reason, messageId);
              Alert.alert('', t.report_success);
            },
          })),
          { text: t.cancel, style: 'cancel' as const },
        ]);
      }
    },
    [partner, reportUser, t]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </Pressable>
          <Avatar
            uri={partner?.avatar_url}
            name={partner?.display_name ?? ''}
            size={32}
            onPress={partner ? () => setProfileVisible(true) : undefined}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {partner?.display_name ?? t.chat_fallbackName}
            </Text>
          </View>
          <Pressable
            style={styles.menuButton}
            onPress={handleHeaderMenu}
            accessibilityLabel="Chat options"
            accessibilityRole="button"
          >
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
          data={invertedMessages}
          inverted
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isOwn={item.sender_id === user?.id}
              userLanguage={userLanguage}
              onImagePress={setViewerImage}
              onUnsend={deleteMessage}
              onReport={handleReportMessage}
            />
          )}
          contentContainerStyle={styles.messagesList}
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            <View style={styles.emptyMessagesInverted}>
              <Text style={styles.emptyMessagesText}>
                {t.chat_empty}
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

      {/* 画像ピッカー（複数選択） */}
      <ImagePickerSheet
        visible={pickerVisible}
        onSend={(uris) => uris.forEach((uri) => sendImage(uri))}
        onClose={() => setPickerVisible(false)}
      />

      {/* 相手のプロフィールモーダル */}
      <UserProfileModal
        profile={partner}
        visible={profileVisible}
        onClose={() => setProfileVisible(false)}
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
  emptyMessagesInverted: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    transform: [{ scaleY: -1 }],
  },
  emptyMessagesText: {
    ...typography.sub,
    color: colors.subText,
  },
});
