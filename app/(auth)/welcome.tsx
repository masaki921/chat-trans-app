import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing } from '../../src/theme';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>CT</Text>
          </View>
          <Text style={styles.appName}>ChatTranslate</Text>
          <Text style={styles.tagline}>言語の壁を越えて、つながろう</Text>
        </View>

        <View style={styles.buttonArea}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.push('/(auth)/register-step1')}
          >
            <Text style={styles.primaryButtonText}>はじめる</Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.secondaryButtonText}>
              アカウントをお持ちの方はこちら
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
