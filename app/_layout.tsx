import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useAuthStore } from '../src/stores/authStore';
import { useNotifications } from '../src/hooks/useNotifications';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialized, session, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useNotifications();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!initialized) return;

    SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/chats');
    }
  }, [initialized, session]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar style="dark" />
      <Slot />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
