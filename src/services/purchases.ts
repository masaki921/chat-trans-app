import { Platform } from 'react-native';
import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { REVENUECAT_API_KEY_IOS, REVENUECAT_API_KEY_ANDROID, ENTITLEMENT_ID } from '../utils/constants';

let isConfigured = false;

export async function configurePurchases(userId: string) {
  if (isConfigured) return;

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    await Purchases.configure({ apiKey, appUserID: userId });
    isConfigured = true;
  } catch (e) {
    // Expo Goではネイティブストアが使えないため無視
    console.warn('RevenueCat not available (Expo Go?):', (e as Error).message);
  }
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) return [];
  return current.availablePackages;
}

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}

export function isBasicUser(customerInfo: CustomerInfo): boolean {
  return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return await Purchases.getCustomerInfo();
}

// RevenueCat Paywall — ダッシュボードで設定した課金画面を表示
export async function presentPaywall(): Promise<boolean> {
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: ENTITLEMENT_ID,
  });
  // PURCHASED or RESTORED → true, それ以外 → false
  return result === 'PURCHASED' || result === 'RESTORED';
}

// Customer Center — サブスク管理画面を表示（解約・プラン変更等）
export async function presentCustomerCenter(): Promise<void> {
  await RevenueCatUI.presentCustomerCenter();
}

// CustomerInfo変更リスナーの登録・解除
export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void
): () => void {
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
