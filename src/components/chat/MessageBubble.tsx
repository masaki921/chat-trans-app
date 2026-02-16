import { View, Text, StyleSheet } from 'react-native';
import { MessageWithSender } from '../../types/chat';
import { colors, typography, spacing } from '../../theme';
import { formatMessageTime } from '../../utils/formatDate';
import { BUBBLE_BORDER_RADIUS } from '../../utils/constants';

type Props = {
  message: MessageWithSender;
  isOwn: boolean;
  userLanguage: string;
};

export function MessageBubble({ message, isOwn, userLanguage }: Props) {
  const needsTranslation = message.original_language !== userLanguage;
  const translatedText = message.translations?.[userLanguage];
  const time = formatMessageTime(message.created_at);

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
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

        {/* 時刻 */}
        <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
          {time}
        </Text>
      </View>
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
