import { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../src/theme';
import { useI18n } from '../../src/i18n';

type OnboardingPage = {
  key: string;
  titleKey: 'onboarding_page1_title' | 'onboarding_page2_title' | 'onboarding_page3_title';
  subtitleKey: 'onboarding_page1_subtitle' | 'onboarding_page2_subtitle' | 'onboarding_page3_subtitle';
  illustration: React.ReactNode;
};

function ChatIllustration() {
  return (
    <View style={illustrationStyles.container}>
      {/* 左側: 日本語バブル */}
      <View style={[illustrationStyles.bubble, illustrationStyles.leftBubble]}>
        <Text style={illustrationStyles.leftText}>元気？</Text>
      </View>
      {/* 中央: 翻訳アイコン */}
      <View style={illustrationStyles.translateIcon}>
        <Ionicons name="swap-horizontal" size={28} color={colors.primary} />
      </View>
      {/* 右側: 英語バブル */}
      <View style={[illustrationStyles.bubble, illustrationStyles.rightBubble]}>
        <Text style={illustrationStyles.rightText}>I'm great!</Text>
      </View>
    </View>
  );
}

function ContextIllustration() {
  return (
    <View style={illustrationStyles.contextContainer}>
      <View style={illustrationStyles.contextBubbleRow}>
        <View style={[illustrationStyles.miniBubble, illustrationStyles.leftBubble]}>
          <Text style={illustrationStyles.miniText}>明日行く？</Text>
        </View>
      </View>
      <View style={illustrationStyles.arrowContainer}>
        <Ionicons name="arrow-down" size={20} color={colors.primary} />
        <Text style={illustrationStyles.arrowLabel}>AI</Text>
        <Ionicons name="arrow-down" size={20} color={colors.primary} />
      </View>
      <View style={illustrationStyles.contextBubbleRow}>
        <View style={[illustrationStyles.miniBubble, illustrationStyles.rightBubble]}>
          <Text style={illustrationStyles.miniRightText}>Are you going{'\n'}tomorrow?</Text>
        </View>
      </View>
    </View>
  );
}

function FriendCodeIllustration() {
  return (
    <View style={illustrationStyles.friendContainer}>
      <Ionicons name="earth" size={64} color={colors.primary} style={{ opacity: 0.3 }} />
      <View style={illustrationStyles.codeCard}>
        <Ionicons name="qr-code-outline" size={24} color={colors.primary} />
        <Text style={illustrationStyles.codeText}>A1B2C3D4</Text>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const pages: OnboardingPage[] = [
    {
      key: '1',
      titleKey: 'onboarding_page1_title',
      subtitleKey: 'onboarding_page1_subtitle',
      illustration: <ChatIllustration />,
    },
    {
      key: '2',
      titleKey: 'onboarding_page2_title',
      subtitleKey: 'onboarding_page2_subtitle',
      illustration: <ContextIllustration />,
    },
    {
      key: '3',
      titleKey: 'onboarding_page3_title',
      subtitleKey: 'onboarding_page3_subtitle',
      illustration: <FriendCodeIllustration />,
    },
  ];

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentPage(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goToAuth = () => router.push('/(auth)/register-step1');
  const goToLogin = () => router.push('/(auth)/login');

  const renderPage = ({ item, index }: { item: OnboardingPage; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    return (
      <View style={[styles.page, { width }]}>
        <Animated.View style={[styles.illustrationArea, { opacity, transform: [{ scale }] }]}>
          {item.illustration}
        </Animated.View>
        <Animated.View style={[styles.textArea, { opacity }]}>
          <Text style={styles.pageTitle}>{t[item.titleKey]}</Text>
          <Text style={styles.pageSubtitle}>{t[item.subtitleKey]}</Text>
        </Animated.View>
      </View>
    );
  };

  const isLastPage = currentPage === pages.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      <SafeAreaView edges={['top']} style={styles.skipContainer}>
        {!isLastPage && (
          <Pressable onPress={goToAuth} style={styles.skipButton}>
            <Text style={styles.skipText}>{t.onboarding_skip}</Text>
          </Pressable>
        )}
      </SafeAreaView>

      {/* Pages */}
      <Animated.FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Bottom area */}
      <SafeAreaView edges={['bottom']}>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {pages.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotScale = scrollX.interpolate({
              inputRange,
              outputRange: [1, 1.4, 1],
              extrapolate: 'clamp',
            });
            const dotOpacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  {
                    opacity: dotOpacity,
                    transform: [{ scale: dotScale }],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* CTA Buttons */}
        <View style={styles.buttonArea}>
          {isLastPage ? (
            <>
              <Pressable
                style={styles.primaryButton}
                onPress={goToAuth}
                accessibilityRole="button"
                accessibilityLabel={t.welcome_start}
              >
                <Text style={styles.primaryButtonText}>{t.welcome_start}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryButton}
                onPress={goToLogin}
                accessibilityRole="button"
                accessibilityLabel={t.welcome_hasAccount}
              >
                <Text style={styles.secondaryButtonText}>{t.welcome_hasAccount}</Text>
              </Pressable>
            </>
          ) : (
            <View style={styles.spacer} />
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const illustrationStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  bubble: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: 200,
  },
  leftBubble: {
    backgroundColor: colors.theirBubble,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  rightBubble: {
    backgroundColor: colors.myBubble,
    alignSelf: 'flex-end',
    marginRight: 20,
  },
  leftText: {
    fontSize: 18,
    color: colors.text,
  },
  rightText: {
    fontSize: 18,
    color: colors.white,
  },
  translateIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contextContainer: {
    alignItems: 'center',
    gap: 8,
  },
  contextBubbleRow: {
    width: '100%',
    paddingHorizontal: 40,
  },
  miniBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  miniText: {
    fontSize: 15,
    color: colors.text,
  },
  miniRightText: {
    fontSize: 15,
    color: colors.white,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  arrowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  friendContainer: {
    alignItems: 'center',
    gap: 20,
  },
  codeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  codeText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: 3,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skipContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  skipText: {
    fontSize: 15,
    color: colors.subText,
    fontWeight: '500',
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationArea: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 40,
    width: '100%',
  },
  textArea: {
    paddingHorizontal: spacing.xl,
    paddingBottom: 20,
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    color: colors.subText,
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  buttonArea: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
    minHeight: 120,
  },
  spacer: {
    height: 120,
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
