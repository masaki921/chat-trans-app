import { forwardRef, useImperativeHandle, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFriendships } from '../../hooks/useFriendships';
import { colors, typography, spacing } from '../../theme';
import { useI18n } from '../../i18n';

export type AddFriendSheetRef = {
  open: () => void;
  close: () => void;
};

export const AddFriendSheet = forwardRef<AddFriendSheetRef>((_, ref) => {
  const { sendFriendRequest } = useFriendships();
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setVisible(true),
    close: () => setVisible(false),
  }));

  const handleSend = async () => {
    if (!userId.trim()) {
      Alert.alert(t.error, t.addFriend_idRequired);
      return;
    }

    setIsLoading(true);
    const { error } = await sendFriendRequest(userId.trim());
    setIsLoading(false);

    if (error) {
      Alert.alert(t.error, error.message);
    } else {
      Alert.alert(t.addFriend_success, t.addFriend_successMessage);
      setUserId('');
      setVisible(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
        <View style={styles.sheet}>
          <View style={styles.handleArea}>
            <View style={styles.handle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>{t.addFriend_title}</Text>
            <Pressable onPress={() => setVisible(false)}>
              <Ionicons name="close" size={24} color={colors.subText} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <Text style={styles.description}>
              {t.addFriend_description}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={t.addFriend_placeholder}
              placeholderTextColor={colors.subText}
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Pressable
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t.addFriend_sending : t.addFriend_send}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

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
    paddingBottom: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  description: {
    ...typography.sub,
    color: colors.subText,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
});
