import { useEffect } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../stores/authStore';

export function useOnlineStatus() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const setOnline = (isOnline: boolean) => {
      supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .then();
    };

    // アプリ起動時にオンラインに設定
    setOnline(true);

    const subscription = AppState.addEventListener('change', (state) => {
      setOnline(state === 'active');
    });

    return () => {
      setOnline(false);
      subscription.remove();
    };
  }, [user]);
}
