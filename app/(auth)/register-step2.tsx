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
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { colors, typography, spacing } from '../../src/theme';
import { getDeviceLanguage } from '../../src/utils/languages';
import { useAvatarPicker } from '../../src/hooks/useAvatarPicker';
import { useI18n } from '../../src/i18n';

export default function RegisterStep2Screen() {
  const router = useRouter();
  const { user, updateProfile, isLoading } = useAuthStore();
  const { t } = useI18n();
  const [displayName, setDisplayName] = useState('');
  const { avatarUri, isUploading, showPicker, uploadLocalAvatar } =
    useAvatarPicker({ localOnly: true });

  const handleComplete = async () => {
    if (!displayName.trim()) {
      Alert.alert(t.error, t.profile_setup_nameRequired);
      return;
    }
    if (!user) return;

    const primaryLanguage = getDeviceLanguage();

    let avatarUrl: string | null = null;
    if (avatarUri) {
      avatarUrl = await uploadLocalAvatar(user.id);
    }

    const updates: Record<string, unknown> = {
      display_name: displayName.trim(),
      primary_language: primaryLanguage,
    };
    if (avatarUrl) {
      updates.avatar_url = avatarUrl;
    }

    const { error } = await updateProfile(updates);

    if (error) {
      Alert.alert(t.error, error.message);
      return;
    }

    router.replace('/(tabs)/chats');
  };

  const busy = isLoading || isUploading;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          <Text style={styles.title}>{t.profile_setup_title}</Text>
          <Text style={styles.step}>{t.profile_setup_step}</Text>

          <View style={styles.avatarArea}>
            <Pressable
              style={styles.avatarPlaceholder}
              onPress={showPicker}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarIcon}>📷</Text>
              )}
              {isUploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
            </Pressable>
            <Text style={styles.avatarHint}>{t.profile_setup_photo}</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder={t.profile_setup_name}
              placeholderTextColor={colors.subText}
              value={displayName}
              onChangeText={setDisplayName}
              autoFocus
            />
          </View>

          <Text style={styles.hint}>{t.profile_setup_hint}</Text>

          <Pressable
            style={[styles.button, busy && styles.buttonDisabled]}
            onPress={handleComplete}
            disabled={busy}
          >
            <Text style={styles.buttonText}>
              {busy ? t.profile_setup_loading : t.profile_setup_start}
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
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
