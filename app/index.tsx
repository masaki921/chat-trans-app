import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const { session, initialized } = useAuthStore();

  if (!initialized) return null;

  if (session) {
    return <Redirect href="/(tabs)/chats" />;
  }

  return <Redirect href="/(auth)/welcome" />;
}
