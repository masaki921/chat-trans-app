import { View, Text, StyleSheet, Pressable, ActionSheetIOS, Platform, Alert } from 'react-native';
import { Image } from 'expo-image';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { MessageWithSender } from '../../types/chat';
import { colors, typography, spacing } from '../../theme';
import { formatMessageTime } from '../../utils/formatDate';
import { BUBBLE_BORDER_RADIUS } from '../../utils/constants';
import { useI18n } from '../../i18n';

type Props = {
  message: MessageWithSender;
  isOwn: boolean;
  userLanguage: string;
  onImagePress?: (uri: string) => void;
  onUnsend?: (messageId: string, mediaUrl?: string | null) => void;
  onReport?: (messageId: string) => void;
};

async function saveImageToDevice(uri: string, successMsg: string, errorMsg: string, permissionMsg: string) {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('', permissionMsg);
    return;
  }
  try {
    const filename = (uri.split('/').pop() || 'image.jpg').split('?')[0];
    const localUri = FileSystem.cacheDirectory + filename;
    await FileSystem.downloadAsync(uri, localUri);
    await MediaLibrary.saveToLibraryAsync(localUri);
    await FileSystem.deleteAsync(localUri, { idempotent: true });
    Alert.alert('', successMsg);
  } catch {
    Alert.alert('', errorMsg);
  }
}

export function MessageBubble({ message, isOwn, userLanguage, onImagePress, onUnsend, onReport }: Props) {
  const { t } = useI18n();
  const needsTranslation = message.original_language !== userLanguage;
  const translatedText = message.translations?.[userLanguage];
  const time = formatMessageTime(message.created_at);
  const isImage = message.type === 'image' && message.media_url;

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isImage) {
      if (isOwn) {
        const options = [t.message_saveImage, t.message_unsend, t.cancel];
        const destructiveButtonIndex = 1;
        const cancelButtonIndex = 2;

        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            { options, destructiveButtonIndex, cancelButtonIndex },
            (buttonIndex) => {
              if (buttonIndex === 0) saveImageToDevice(message.media_url!, t.message_saved, t.message_saveFailed, t.message_permissionNeeded);
              if (buttonIndex === 1) onUnsend?.(message.id, message.media_url);
            }
          );
        } else {
          Alert.alert('', '', [
            { text: t.message_saveImage, onPress: () => saveImageToDevice(message.media_url!, t.message_saved, t.message_saveFailed, t.message_permissionNeeded) },
            { text: t.message_unsend, style: 'destructive', onPress: () => onUnsend?.(message.id, message.media_url) },
            { text: t.cancel, style: 'cancel' },
          ]);
        }
      } else {
        const options = [t.message_saveImage, t.report_message, t.cancel];
        const cancelButtonIndex = 2;

        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            { options, cancelButtonIndex },
            (buttonIndex) => {
              if (buttonIndex === 0) saveImageToDevice(message.media_url!, t.message_saved, t.message_saveFailed, t.message_permissionNeeded);
              if (buttonIndex === 1) onReport?.(message.id);
            }
          );
        } else {
          Alert.alert('', '', [
            { text: t.message_saveImage, onPress: () => saveImageToDevice(message.media_url!, t.message_saved, t.message_saveFailed, t.message_permissionNeeded) },
            { text: t.report_message, onPress: () => onReport?.(message.id) },
            { text: t.cancel, style: 'cancel' },
          ]);
        }
      }
    } else {
      const copyText = needsTranslation && translatedText
        ? `${translatedText}\n${message.content}`
        : message.content;

      if (isOwn) {
        const options = [t.copy, t.message_unsend, t.cancel];
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
            { text: t.copy, onPress: () => Clipboard.setStringAsync(copyText) },
            { text: t.message_unsend, style: 'destructive', onPress: () => onUnsend?.(message.id) },
            { text: t.cancel, style: 'cancel' },
          ]);
        }
      } else {
        const options = [t.copy, t.report_message, t.cancel];
        const cancelButtonIndex = 2;

        if (Platform.OS === 'ios') {
          ActionSheetIOS.showActionSheetWithOptions(
            { options, cancelButtonIndex },
            (buttonIndex) => {
              if (buttonIndex === 0) Clipboard.setStringAsync(copyText);
              if (buttonIndex === 1) onReport?.(message.id);
            }
          );
        } else {
          Alert.alert('', '', [
            { text: t.copy, onPress: () => Clipboard.setStringAsync(copyText) },
            { text: t.report_message, onPress: () => onReport?.(message.id) },
            { text: t.cancel, style: 'cancel' },
          ]);
        }
      }
    }
  };

  if (isImage) {
    return (
      <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
        <Pressable
          onPress={() => onImagePress?.(message.media_url!)}
          onLongPress={handleLongPress}
          accessibilityLabel={`Image message, ${time}`}
          accessibilityHint="Long press for options"
        >
          <Image
            source={{ uri: message.media_url! }}
            style={styles.image}
            contentFit="cover"
          />
        </Pressable>
        <Text style={styles.imageTime}>{time}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      <Pressable
        onLongPress={handleLongPress}
        style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
        accessibilityLabel={`${message.content}, ${time}`}
        accessibilityHint="Long press for options"
      >
        {isOwn ? (
          <>
            <Text style={[styles.mainText, styles.mainTextOwn]}>{message.content}</Text>
            {needsTranslation && translatedText && (
              <Text style={[styles.subText, styles.subTextOwn]}>{translatedText}</Text>
            )}
          </>
        ) : (
          <>
            <Text style={[styles.mainText, styles.mainTextOther]}>
              {needsTranslation && translatedText ? translatedText : message.content}
            </Text>
            {needsTranslation && translatedText && (
              <Text style={[styles.subText, styles.subTextOther]}>{message.content}</Text>
            )}
          </>
        )}
        <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>{time}</Text>
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
  image: {
    width: 200,
    height: 200,
    borderRadius: BUBBLE_BORDER_RADIUS,
  },
  imageTime: {
    fontSize: 11,
    marginTop: 3,
    color: colors.subText,
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
