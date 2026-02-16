import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  const { session, user, profile, isLoading, initialized } = useAuthStore();

  return {
    session,
    user,
    profile,
    isLoading,
    initialized,
    isAuthenticated: !!session,
  };
}
