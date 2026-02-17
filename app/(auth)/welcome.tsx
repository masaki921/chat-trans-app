import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../src/theme';
import { useI18n } from '../../src/i18n';

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CT</Text>
          </View>
          <Text style={styles.appName}>ChatTranslate</Text>
          <Text style={styles.tagline}>{t.welcome_tagline}</Text>
        </View>

        <View style={styles.buttonArea}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register-step1')}
            accessibilityRole="button"
            accessibilityLabel={t.welcome_start}
          >
            <Text style={styles.primaryButtonText}>{t.welcome_start}</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
            accessibilityRole="button"
            accessibilityLabel={t.welcome_hasAccount}
          >
            <Text style={styles.secondaryButtonText}>
              {t.welcome_hasAccount}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  logoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.white,
  },
  appName: {
    ...typography.heading,
    fontSize: 28,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.sub,
    color: colors.subText,
  },
  buttonArea: {
    gap: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
