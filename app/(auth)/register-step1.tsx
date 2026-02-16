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

export default function RegisterStep1Screen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleNext = async () => {
    if (!email.trim()) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }
    if (password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    const { error } = await signUp(email.trim(), password);
    if (error) {
      Alert.alert('登録エラー', error.message);
      return;
    }

    router.push('/(auth)/register-step2');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backText}>← 戻る</Text>
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>アカウント作成</Text>
          <Text style={styles.step}>ステップ 1 / 2</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              placeholderTextColor={colors.subText}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TextInput
              style={styles.input}
              placeholder="パスワード（6文字以上）"
              placeholderTextColor={colors.subText}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <Pressable
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleNext}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? '処理中...' : '次へ →'}
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
  form: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
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
