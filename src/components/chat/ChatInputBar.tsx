import { useState } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { MAX_MESSAGE_LENGTH } from '../../utils/constants';
import { useI18n } from '../../i18n';

type Props = {
  onSend: (text: string) => void;
  onAttach?: () => void;
};

export function ChatInputBar({ onSend, onAttach }: Props) {
  const [text, setText] = useState('');
  const { t } = useI18n();

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.attachButton}
        onPress={onAttach}
        accessibilityLabel={t.chat_sendImage}
        accessibilityRole="button"
      >
        <Ionicons name="attach" size={24} color={colors.subText} />
      </Pressable>

      <TextInput
        style={styles.input}
        placeholder={t.chat_inputPlaceholder}
        placeholderTextColor={colors.subText}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={MAX_MESSAGE_LENGTH}
        accessibilityLabel={t.chat_inputPlaceholder}
      />

      {text.trim().length > 0 && (
        <Pressable
          style={styles.sendButton}
          onPress={handleSend}
          accessibilityLabel="Send"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-up" size={20} color={colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: colors.divider,
    gap: spacing.sm,
  },
  attachButton: {
    padding: spacing.sm,
    marginBottom: 2,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
