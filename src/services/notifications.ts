import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from './supabase';

// フォアグラウンドでの通知表示設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * プッシュ通知の権限を取得し、トークンをDBに保存する
 */
export async function registerForPushNotifications(
  userId: string
): Promise<string | null> {
  // 物理デバイスのみ（シミュレータは非対応）
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // 権限リクエスト
  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Expo Push Token取得
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId: '3b623790-2907-449c-bc32-feb120afa066',
  });

  // DBに保存
  await supabase
    .from('profiles')
    .update({ push_token: token })
    .eq('id', userId);

  return token;
}

/**
 * push_tokenをDBからクリアする（サインアウト時）
 */
export async function unregisterPushToken(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ push_token: null })
    .eq('id', userId);
}
