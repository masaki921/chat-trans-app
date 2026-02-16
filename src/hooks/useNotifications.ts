import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { registerForPushNotifications } from '../services/notifications';

// 現在閲覧中の会話IDを追跡（通知抑制用）
let activeConversationId: string | null = null;

export function setActiveConversation(id: string | null) {
  activeConversationId = id;
}

export function useNotifications() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (!user) return;

    // トークン登録
    registerForPushNotifications(user.id);

    // 通知タップ時のハンドラー
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.conversationId) {
          router.push(`/(tabs)/chats/${data.conversationId}`);
        }
      });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user]);

  // フォアグラウンド通知の表示制御
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const data = notification.request.content.data;
        // 現在閲覧中の会話の通知は非表示
        if (data?.conversationId === activeConversationId) {
          Notifications.dismissNotificationAsync(
            notification.request.identifier
          );
        }
      }
    );

    return () => subscription.remove();
  }, []);
}
