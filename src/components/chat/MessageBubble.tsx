import { View, Text, StyleSheet, Pressable, ActionSheetIOS, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { MessageWithSender } from '../../types/chat';
import { colors, typography, spacing } from '../../theme';
import { formatMessageTime } from '../../utils/formatDate';
import { BUBBLE_BORDER_RADIUS } from '../../utils/constants';

type Props = {
  message: MessageWithSender;
  isOwn: boolean;
  userLanguage: string;
  onImagePress?: (uri: string) => void;
  onUnsend?: (messageId: string, mediaUrl?: string | null) => void;
};

export function MessageBubble({ message, isOwn, userLanguage, onImagePress, onUnsend }: Props) {
  const needsTranslation = message.original_language !== userLanguage;
  const translatedText = message.translations?.[userLanguage];
  const time = formatMessageTime(message.created_at);
  const isImage = message.type === 'image' && message.media_url;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isImage) {
      // 画像 & 自分のメッセージのみ送信取り消し
      if (!isOwn) return;

      const options = ['送信取り消し', 'キャンセル'];
      const destructiveButtonIndex = 0;
      const cancelButtonIndex = 1;

      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          { options, destructiveButtonIndex, cancelButtonIndex },
          (buttonIndex) => {
            if (buttonIndex === 0) onUnsend?.(message.id, message.media_url);
          }
        );
      } else {
        Alert.alert('', '', [
          { text: '送信取り消し', style: 'destructive', onPress: () => onUnsend?.(message.id, message.media_url) },
          { text: 'キャンセル', style: 'cancel' },
        ]);
      }
    } else {
      // テキストメッセージ
      const copyText = needsTranslation && translatedText
        ? `${translatedText}\n${message.content}`
        : message.content;

      if (isOwn) {
        const options = ['コピー', '送信取り消し', 'キャンセル'];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 2;

        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            { options, destructiveButtonIndex, cancelButtonIndex },
            (buttonIndex) => {
              if (buttonIndex === 0) Clipboard.setStringAsync(copyText);
              if (buttonIndex === 1) onUnsend?.(message.id);
            }
          );
        } else {
          Alert.alert('', '', [
            { text: 'コピー', onPress: () => Clipboard.setStringAsync(copyText) },
            { text: '送信取り消し', style: 'destructive', onPress: () => onUnsend?.(message.id) },
            { text: 'キャンセル', style: 'cancel' },
          ]);
        }
      } else {
        const options = ['コピー', 'キャンセル'];
        const cancelButtonIndex = 1;

        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            { options, cancelButtonIndex },
            (buttonIndex) => {
              if (buttonIndex === 0) Clipboard.setStringAsync(copyText);
            }
          );
        } else {
          Alert.alert('', '', [
            { text: 'コピー', onPress: () => Clipboard.setStringAsync(copyText) },
            { text: 'キャンセル', style: 'cancel' },
          ]);
        }
      }
    }
  };

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      <Pressable
        onLongPress={handleLongPress}
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
          isImage && styles.bubbleImage,
        ]}
      >
        {isImage ? (
          <Pressable onPress={() => onImagePress?.(message.media_url!)}>
            <Image
              source={{ uri: message.media_url! }}
              style={styles.image}
              contentFit="cover"
            />
          </Pressable>
        ) : (
          <>
            {/* メインテキスト */}
            {isOwn ? (
              <>
                {/* 自分: 原文がメイン */}
                <Text style={[styles.mainText, styles.mainTextOwn]}>
                  {message.content}
                </Text>
                {/* 自分の送信に翻訳がある場合、翻訳を小さく表示 */}
                {needsTranslation && translatedText && (
                  <Text style={[styles.subText, styles.subTextOwn]}>
                    {translatedText}
                  </Text>
                )}
              </>
            ) : (
              <>
                {/* 相手: 翻訳があればそれがメイン、なければ原文 */}
                <Text style={[styles.mainText, styles.mainTextOther]}>
                  {needsTranslation && translatedText ? translatedText : message.content}
                </Text>
                {/* 翻訳されたメッセージは原文を小さく表示 */}
                {needsTranslation && translatedText && (
                  <Text style={[styles.subText, styles.subTextOther]}>
                    {message.content}
                  </Text>
                )}
              </>
            )}
          </>
        )}

        {/* 時刻 */}
        <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
          {time}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    marginVertical: 2,
  },
  containerOwn: {
    alignItems: 'flex-end',
  },
  containerOther: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: BUBBLE_BORDER_RADIUS,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  bubbleOwn: {
    backgroundColor: colors.myBubble,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.theirBubble,
    borderBottomLeftRadius: 4,
  },
  bubbleImage: {
    paddingHorizontal: 4,
    paddingTop: 4,
    overflow: 'hidden',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: BUBBLE_BORDER_RADIUS - 4,
  },
  mainText: {
    ...typography.bubbleText,
  },
  mainTextOwn: {
    color: colors.white,
  },
  mainTextOther: {
    color: colors.text,
  },
  subText: {
    ...typography.bubbleSub,
    marginTop: 4,
  },
  subTextOwn: {
    color: 'rgba(255,255,255,0.8)',
  },
  subTextOther: {
    color: 'rgba(26,26,46,0.6)',
  },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
  timeOwn: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'left',
  },
  timeOther: {
    color: colors.subText,
    textAlign: 'right',
  },
});
