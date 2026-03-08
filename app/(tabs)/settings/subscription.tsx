import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { colors, spacing } from '../../../src/theme';
import { useI18n } from '../../../src/i18n';
import { useSubscription } from '../../../src/hooks/useSubscription';
import {
  getOfferings,
  restorePurchases,
  isBasicUser,
  presentPaywall,
  presentCustomerCenter,
} from '../../../src/services/purchases';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const sub = useSubscription();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  useEffect(() => {
    getOfferings().then(setPackages).catch(console.error);
  }, []);

  const yearlyPkg = packages.find(
    (p) => p.packageType === 'ANNUAL' || p.identifier.includes('yearly') || p.identifier.includes('annual')
  );
  const monthlyPkg = packages.find(
    (p) => p.packageType === 'MONTHLY' || p.identifier.includes('monthly')
  );

  // RevenueCat Paywallをメインの購入フローとして使用
  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      const purchased = await presentPaywall();
      if (purchased) {
        sub.refetch();
      }
    } catch (e: any) {
      console.log('Paywall dismissed:', e.message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      const customerInfo = await restorePurchases();
      if (isBasicUser(customerInfo)) {
        sub.refetch();
        Alert.alert('', t.subscription_unlimited);
      } else {
        Alert.alert('', 'No active subscription found');
      }
    } catch (e: any) {
      Alert.alert(t.error, e.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Customer Centerを表示（解約・プラン変更等）
  const handleManageSubscription = async () => {
    try {
      await presentCustomerCenter();
      sub.refetch();
    } catch (e: any) {
      console.log('Customer Center dismissed:', e.message);
    }
  };

  const usagePercent = sub.translationsLimit > 0
    ? (sub.translationsUsed / sub.translationsLimit) * 100
    : 0;
  const isHighUsage = usagePercent >= 80;

  if (sub.isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ActivityIndicator style={{ flex: 1 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.subscription_title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Active subscriber view */}
        {sub.isBasic ? (
          <>
            <View style={styles.statusCard}>
              <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.statusTitle}>{t.subscription_basic_plan}</Text>
                <Text style={styles.statusSub}>{t.subscription_unlimited}</Text>
              </View>
            </View>

            {/* Manage subscription via Customer Center */}
            <Pressable style={styles.manageButton} onPress={handleManageSubscription}>
              <Ionicons name="settings-outline" size={20} color={colors.primary} />
              <Text style={styles.manageButtonText}>{t.subscription_manage}</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.subText} />
            </Pressable>
          </>
        ) : (
          <>
            {/* Hero section */}
            <View style={styles.heroSection}>
              <Ionicons name="rocket" size={48} color={colors.primary} />
              <Text style={styles.heroTitle}>{t.subscription_hero_title}</Text>
              <Text style={styles.heroSubtitle}>{t.subscription_hero_subtitle}</Text>
            </View>

            {/* Usage bar */}
            <View style={styles.usageBar}>
              <View style={styles.usageTrack}>
                <View
                  style={[
                    styles.usageFill,
                    {
                      width: `${Math.min(100, usagePercent)}%`,
                      backgroundColor: isHighUsage ? colors.ctaStart : colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.usageText}>
                {sub.translationsUsed} / {sub.translationsLimit}
              </Text>
              <Text style={styles.usageSubText}>
                {sub.isFirstMonth
                  ? t.subscription_remaining_bonus.replace('{count}', String(sub.remainingTranslations))
                  : t.subscription_remaining.replace('{count}', String(sub.remainingTranslations))}
              </Text>
            </View>

            {/* Yearly plan card */}
            <Pressable
              style={[
                styles.planCard,
                styles.yearlyCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              {/* Savings badge */}
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsBadgeText}>
                  {t.subscription_savings_badge.replace('{percent}', '37')}
                </Text>
              </View>
              {/* Recommended badge */}
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedBadgeText}>{t.subscription_recommended}</Text>
              </View>

              <View style={styles.planHeader}>
                <View style={[styles.radio, selectedPlan === 'yearly' && styles.radioSelected]}>
                  {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.planName}>{t.subscription_yearly}</Text>
              </View>

              <Text style={styles.yearlyPrice}>
                {yearlyPkg?.product.priceString ?? '¥1,500'}
                <Text style={styles.yearlyPriceSuffix}>/年</Text>
              </Text>

              <Text style={styles.monthlyEquivalent}>
                {t.subscription_yearly_equivalent.replace('{price}', '¥125')}
              </Text>

              <Text style={styles.strikePrice}>
                {t.subscription_monthly_equivalent.replace('{price}', '¥2,400')}
              </Text>
            </Pressable>

            {/* Monthly plan card */}
            <Pressable
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <View style={[styles.radio, selectedPlan === 'monthly' && styles.radioSelected]}>
                  {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                </View>
                <Text style={styles.planName}>{t.subscription_monthly}</Text>
                <Text style={styles.monthlyPrice}>
                  {monthlyPkg?.product.priceString ?? '¥200'}
                  <Text style={styles.monthlyPriceSuffix}>/月</Text>
                </Text>
              </View>
            </Pressable>

            {/* CTA Button */}
            <Pressable onPress={handlePurchase} disabled={isPurchasing}>
              <LinearGradient
                colors={[colors.ctaStart, colors.ctaEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaButton}
              >
                {isPurchasing ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.ctaButtonText}>{t.subscription_cta_button}</Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Daily cost framing - only for yearly */}
            {selectedPlan === 'yearly' && (
              <Text style={styles.dailyCost}>
                {t.subscription_daily_cost.replace('{price}', '¥4')}
              </Text>
            )}

            {/* Features */}
            <View style={styles.featuresCard}>
              {t.subscription_features.split('\n').map((feature, i) => (
                <View key={i} style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Cancel anytime */}
            <Text style={styles.cancelAnytime}>{t.subscription_cancel_anytime}</Text>
          </>
        )}

        {/* Restore */}
        <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={isRestoring}>
          <Text style={styles.restoreText}>
            {isRestoring ? '...' : t.subscription_restore}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.divider,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Active subscriber status
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusSub: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 2,
  },

  // Manage subscription button (Customer Center)
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    gap: 10,
    marginBottom: spacing.md,
  },
  manageButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
  },
  heroSubtitle: {
    fontSize: 14,
    color: colors.subText,
    marginTop: 4,
  },

  // Usage bar
  usageBar: {
    marginBottom: spacing.lg,
  },
  usageTrack: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 13,
    color: colors.subText,
    textAlign: 'right',
    marginTop: 4,
  },
  usageSubText: {
    fontSize: 12,
    color: colors.subText,
    marginTop: 2,
  },

  // Plan cards
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  yearlyCard: {
    paddingTop: spacing.lg,
    marginTop: spacing.sm,
  },
  planCardSelected: {
    borderColor: colors.primary,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.divider,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },

  // Yearly plan specifics
  yearlyPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginLeft: 34,
  },
  yearlyPriceSuffix: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.subText,
  },
  monthlyEquivalent: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.ctaStart,
    marginLeft: 34,
    marginTop: 4,
  },
  strikePrice: {
    fontSize: 12,
    color: colors.subText,
    marginLeft: 34,
    marginTop: 4,
    textDecorationLine: 'line-through',
  },

  // Monthly plan specifics
  monthlyPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  monthlyPriceSuffix: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.subText,
  },

  // Badges
  savingsBadge: {
    position: 'absolute',
    top: -12,
    left: 12,
    backgroundColor: colors.savingsBadge,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -12,
    right: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    zIndex: 1,
  },
  recommendedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },

  // CTA button
  ctaButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  ctaButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },

  // Daily cost
  dailyCost: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.subText,
    marginTop: spacing.sm,
  },

  // Features
  featuresCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontSize: 15,
    color: colors.text,
  },

  // Cancel anytime
  cancelAnytime: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.subText,
    marginTop: spacing.md,
  },

  // Restore
  restoreButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  restoreText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
});
