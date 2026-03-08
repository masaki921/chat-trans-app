import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';
import { FREE_MONTHLY_LIMIT, FREE_FIRST_MONTH_BONUS } from '../utils/constants';
import { isBasicUser, addCustomerInfoListener, getCustomerInfo } from '../services/purchases';

type SubscriptionStatus = 'free' | 'active' | 'expired' | 'cancelled';

type SubscriptionState = {
  status: SubscriptionStatus;
  plan: string | null;
  translationsUsed: number;
  translationsLimit: number;
  isFirstMonth: boolean;
  isLoading: boolean;
};

export function useSubscription() {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<SubscriptionState>({
    status: 'free',
    plan: null,
    translationsUsed: 0,
    translationsLimit: FREE_MONTHLY_LIMIT,
    isFirstMonth: false,
    isLoading: true,
  });

  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // RevenueCatとSupabaseの両方から状態を取得
    const [subResult, usageResult, revenuecatActive] = await Promise.all([
      supabase
        .from('user_subscriptions')
        .select('status, plan, created_at')
        .eq('user_id', user.id)
        .single(),
      supabase
        .from('translation_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .single(),
      getCustomerInfo()
        .then((info) => isBasicUser(info))
        .catch(() => false),
    ]);

    const subscription = subResult.data;
    const usage = usageResult.data;

    const createdAt = subscription?.created_at ? new Date(subscription.created_at) : now;
    const createdMonth = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    const isFirstMonth = currentMonth === createdMonth;

    // RevenueCatの状態を優先（クライアント側の真実の情報源）
    const dbStatus = (subscription?.status as SubscriptionStatus) ?? 'free';
    const status: SubscriptionStatus = revenuecatActive ? 'active' : dbStatus;
    const isActive = status === 'active';
    const limit = isActive ? Infinity : isFirstMonth ? FREE_FIRST_MONTH_BONUS : FREE_MONTHLY_LIMIT;

    setState({
      status,
      plan: subscription?.plan ?? null,
      translationsUsed: usage?.count ?? 0,
      translationsLimit: limit,
      isFirstMonth,
      isLoading: false,
    });
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // RevenueCatのリアルタイムリスナーで購入/解約を即座に反映
  useEffect(() => {
    const remove = addCustomerInfoListener(() => {
      fetchSubscription();
    });
    return remove;
  }, [fetchSubscription]);

  const isBasic = state.status === 'active';
  const remainingTranslations = isBasic
    ? Infinity
    : Math.max(0, state.translationsLimit - state.translationsUsed);
  const isLimitReached = !isBasic && remainingTranslations <= 0;

  return {
    ...state,
    isBasic,
    remainingTranslations,
    isLimitReached,
    refetch: fetchSubscription,
  };
}
