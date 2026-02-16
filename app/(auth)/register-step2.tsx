import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, typography, spacing } from '../../src/theme';
import { getDeviceLanguage } from '../../src/utils/languages';

export default function RegisterStep2Screen() {
  const router = useRouter();
  const { updateProfile, isLoading } = useAuthStore();
  const [displayName, setDisplayName] = useState('');

  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert('エラー', '表示名を入力してください');
      return;
    }

    const primaryLanguage = getDeviceLanguage();

    const { error } = await updateProfile({
      display_name: displayName.trim(),
      primary_language: primaryLanguage,
    });

    if (error) {
      Alert.alert('エラー', error.message);
      return;
    }

    router.replace('/(tabs)/chats');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>プロフィール設定</Text>
          <Text style={styles.step}>ステップ 2 / 2</Text>

          <View style={styles.avatarArea}>
            <Pressable style={styles.avatarPlaceholder}>
              <Text style={styles.avatarIcon}>📷</Text>
            </Pressable>
            <Text style={styles.avatarHint}>タップして写真を追加</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="表示名"
              placeholderTextColor={colors.subText}
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
            />
          </View>

          <Text style={styles.hint}>あとから変更できます</Text>

          <Pressable
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '設定中...' : '始める →'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
  },
  title: {
    ...typography.heading,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  step: {
    ...typography.sub,
    color: colors.subText,
    marginBottom: spacing.xl,
  },
  avatarArea: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarIcon: {
    fontSize: 28,
  },
  avatarHint: {
    ...typography.sub,
    color: colors.subText,
  },
  form: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
  },
  hint: {
    ...typography.sub,
    color: colors.subText,
    textAlign: 'center',
    marginBottom: spacing.lg,
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
